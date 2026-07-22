import { spawnSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import {
  copyFile,
  mkdir,
  open,
  readdir,
  rename,
  stat,
  statfs,
  unlink,
  writeFile
} from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'

import Database from 'better-sqlite3'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const scriptPath = fileURLToPath(import.meta.url)
const nodeExecutable = process.release?.name === 'node' ? process.execPath : 'node'
const allowedArguments = new Set(['db', 'uploads', 'backup-root', 'batch'])

function readArgument(name, fallback) {
  const prefix = `--${name}=`
  const argument = process.argv.find(value => value.startsWith(prefix))
  return argument ? argument.slice(prefix.length) : fallback
}

function printHelp() {
  console.log(`Uso:
  bun run db:migrate-production
  bun run db:migrate-production -- --db=/data/local.db --uploads=/data/uploads --backup-root=/data/backups --batch=10

El comando requiere confirmacion interactiva y ejecuta backup, migracion, verificacion y compactacion.`)
}

function validateArguments() {
  for (const argument of process.argv.slice(2)) {
    if (argument === '--help') continue
    const match = /^--([^=]+)=/.exec(argument)
    if (!match || !allowedArguments.has(match[1])) throw new Error(`argumento no reconocido: ${argument}`)
  }
}

function isPathInside(parentPath, candidatePath) {
  const relativePath = relative(resolve(parentPath), resolve(candidatePath))
  return relativePath === '' || (relativePath !== '..' && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath))
}

async function pathExists(path) {
  try {
    await stat(path)
    return true
  }
  catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false
    throw error
  }
}

async function nearestExistingDirectory(path) {
  let candidate = resolve(path)
  while (!await pathExists(candidate)) {
    const parent = dirname(candidate)
    if (parent === candidate) throw new Error(`no se encontro un directorio existente para ${path}`)
    candidate = parent
  }
  const metadata = await stat(candidate)
  return metadata.isDirectory() ? candidate : dirname(candidate)
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(unit ? 1 : 0)} ${units[unit]}`
}

async function listUploadFiles(rootPath) {
  const files = []
  if (!await pathExists(rootPath)) return files

  async function walk(directoryPath) {
    const entries = await readdir(directoryPath, { withFileTypes: true })
    entries.sort((left, right) => left.name.localeCompare(right.name))

    for (const entry of entries) {
      const absolutePath = join(directoryPath, entry.name)
      if (entry.isDirectory()) await walk(absolutePath)
      else if (entry.isFile()) {
        const metadata = await stat(absolutePath)
        files.push({
          absolutePath,
          relativePath: relative(rootPath, absolutePath).replaceAll('\\', '/'),
          size: metadata.size
        })
      }
      else throw new Error(`uploads contiene un tipo de archivo no permitido: ${absolutePath}`)
    }
  }

  await walk(rootPath)
  return files
}

async function hashFile(filePath) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(filePath)) hash.update(chunk)
  return hash.digest('hex')
}

async function syncFile(filePath) {
  const handle = await open(filePath, 'r')
  try {
    await handle.sync()
  }
  finally {
    await handle.close()
  }
}

async function syncDirectory(directoryPath) {
  const handle = await open(directoryPath, 'r')
  try {
    await handle.sync()
  }
  finally {
    await handle.close()
  }
}

function inspectDatabase(databasePath) {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true })
  try {
    const quickCheck = database.pragma('quick_check', { simple: true })
    const foreignKeyFailures = database.pragma('foreign_key_check')
    if (quickCheck !== 'ok') throw new Error(`quick_check fallo: ${quickCheck}`)
    if (foreignKeyFailures.length) throw new Error(`${foreignKeyFailures.length} errores de foreign keys`)

    const hasVariants = Boolean(database.prepare(`
      select 1 from sqlite_master where type = 'table' and name = 'studio_variants'
    `).get())
    if (!hasVariants) throw new Error('la tabla studio_variants no existe')

    const counts = database.prepare(`
      select
        count(*) as variants,
        sum(case when image_url like 'data:%' then 1 else 0 end) as inline_variants,
        coalesce(sum(case when image_url like 'data:%' then length(image_url) else 0 end), 0) as inline_characters
      from studio_variants
    `).get()

    return {
      quickCheck,
      foreignKeyFailures: foreignKeyFailures.length,
      variants: Number(counts.variants),
      inlineVariants: Number(counts.inline_variants),
      inlineCharacters: Number(counts.inline_characters)
    }
  }
  finally {
    database.close()
  }
}

async function ensureEnoughSpace(requirements) {
  const requirementsByDevice = new Map()

  for (const requirement of requirements) {
    const existingDirectory = await nearestExistingDirectory(requirement.path)
    const metadata = await stat(existingDirectory)
    const device = String(metadata.dev)
    const current = requirementsByDevice.get(device) || {
      path: existingDirectory,
      requiredBytes: 0,
      labels: []
    }
    current.requiredBytes += requirement.bytes
    current.labels.push(requirement.label)
    requirementsByDevice.set(device, current)
  }

  for (const requirement of requirementsByDevice.values()) {
    const filesystem = await statfs(requirement.path)
    const availableBytes = Number(filesystem.bavail) * Number(filesystem.bsize)
    const requiredWithMargin = Math.ceil(requirement.requiredBytes * 1.15) + 64 * 1024 * 1024
    if (availableBytes < requiredWithMargin) {
      throw new Error(
        `espacio insuficiente en ${requirement.path}: se requieren ${formatBytes(requiredWithMargin)} `
        + `para ${requirement.labels.join(', ')} y hay ${formatBytes(availableBytes)}`
      )
    }
    console.log(`[preflight] ${formatBytes(availableBytes)} libres para ${requirement.labels.join(', ')}`)
  }
}

async function createVerifiedBackup({ databasePath, uploadsPath, backupPath, uploadFiles }) {
  await mkdir(backupPath, { recursive: false })
  const backupDatabasePath = join(backupPath, 'local.db')
  const backupUploadsPath = join(backupPath, 'uploads')
  await mkdir(backupUploadsPath)

  const database = new Database(databasePath, { fileMustExist: true })
  try {
    database.pragma('wal_checkpoint(TRUNCATE)')
    await database.backup(backupDatabasePath)
  }
  finally {
    database.close()
  }
  await syncFile(backupDatabasePath)
  const backupDatabaseInspection = inspectDatabase(backupDatabasePath)
  const backupDatabaseHash = await hashFile(backupDatabasePath)

  const uploadManifest = []
  for (const [index, file] of uploadFiles.entries()) {
    const destinationPath = join(backupUploadsPath, file.relativePath)
    await mkdir(dirname(destinationPath), { recursive: true })
    const sourceHash = await hashFile(file.absolutePath)
    await copyFile(file.absolutePath, destinationPath)
    await syncFile(destinationPath)
    const destinationHash = await hashFile(destinationPath)
    if (sourceHash !== destinationHash) throw new Error(`el backup no coincide para ${file.relativePath}`)
    uploadManifest.push({ path: file.relativePath, size: file.size, sha256: sourceHash })
    if ((index + 1) % 100 === 0) console.log(`[backup] ${index + 1}/${uploadFiles.length} archivos`)
  }

  const manifest = {
    format: 'image-studio-pre-migration-v1',
    createdAt: new Date().toISOString(),
    source: { databasePath, uploadsPath },
    database: {
      path: 'local.db',
      size: (await stat(backupDatabasePath)).size,
      sha256: backupDatabaseHash,
      ...backupDatabaseInspection
    },
    uploads: uploadManifest
  }
  const manifestPath = join(backupPath, 'manifest.json')
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' })
  await syncFile(manifestPath)
  await syncDirectory(backupPath)

  console.log(`[backup] verificado en ${backupPath}`)
  return manifest
}

function runCommand(command, args, options = {}) {
  console.log(`\n$ ${command} ${args.join(' ')}`)
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    env: { ...process.env, ...options.env },
    stdio: 'inherit'
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`el comando termino con codigo ${result.status}`)
}

function runSchemaMigration(databasePath) {
  runCommand('bun', ['run', 'db:migrate'], {
    env: { IMAGE_STUDIO_DB_PATH: databasePath }
  })
}

function runImageMigration(databasePath, uploadsPath, batchSize) {
  runCommand(nodeExecutable, [
    resolve(repositoryRoot, 'scripts/migrate-studio-images.mjs'),
    `--db=${databasePath}`,
    `--uploads=${uploadsPath}`,
    `--batch=${batchSize}`
  ])
}

function runImageVerification(databasePath, uploadsPath) {
  runCommand(nodeExecutable, [
    resolve(repositoryRoot, 'scripts/migrate-studio-images.mjs'),
    `--db=${databasePath}`,
    `--uploads=${uploadsPath}`,
    '--verify'
  ])
}

function quoteSqlString(value) {
  return `'${value.replaceAll("'", "''")}'`
}

async function compactDatabase(databasePath, uploadsPath) {
  const compactPath = join(dirname(databasePath), `.${randomUUID()}.compact.db`)
  const database = new Database(databasePath, { fileMustExist: true })
  try {
    database.pragma('wal_checkpoint(TRUNCATE)')
    database.exec(`VACUUM INTO ${quoteSqlString(compactPath)}`)
  }
  finally {
    database.close()
  }

  await syncFile(compactPath)
  inspectDatabase(compactPath)
  runImageVerification(compactPath, uploadsPath)
  await rename(compactPath, databasePath)
  await syncDirectory(dirname(databasePath))
  console.log(`[compact] SQLite reemplazado atomicamente (${formatBytes((await stat(databasePath)).size)})`)
}

async function askForStoppedApplication({ databasePath, uploadsPath, backupPath }) {
  console.log('\nAntes de continuar deben estar detenidas TODAS las instancias de Image Studio.')
  console.log(`SQLite: ${databasePath}`)
  console.log(`Uploads: ${uploadsPath}`)
  console.log(`Backup:  ${backupPath}`)

  const readline = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = await readline.question('\n¿La app ya no esta corriendo en ninguna instancia? Escribe SI para continuar: ')
    return answer.trim().toLocaleUpperCase('es') === 'SI'
  }
  finally {
    readline.close()
  }
}

async function acquireMigrationLock(databasePath) {
  const lockPath = `${databasePath}.migration.lock`
  let handle
  try {
    handle = await open(lockPath, 'wx')
  }
  catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
      throw new Error(`ya existe ${lockPath}; confirma que no hay otra migracion y elimina el lock obsoleto manualmente`)
    }
    throw error
  }
  await handle.writeFile(`${JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })}\n`)
  await handle.sync()
  return async () => {
    await handle.close()
    await unlink(lockPath).catch(() => undefined)
  }
}

export async function migrateProduction(options = {}) {
  if (!options.databasePath && process.argv.includes('--help')) {
    printHelp()
    return { help: true }
  }
  if (!options.databasePath) validateArguments()

  const databasePath = resolve(options.databasePath || readArgument('db', process.env.IMAGE_STUDIO_DB_PATH || 'server/db/local.db'))
  const uploadsPath = resolve(options.uploadsPath || readArgument('uploads', process.env.IMAGE_STUDIO_UPLOADS_ROOT || 'public/uploads'))
  const backupRoot = resolve(options.backupRoot || readArgument('backup-root', '.migration-backups'))
  const batchSize = Number(options.batchSize || readArgument('batch', '10'))
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 100) {
    throw new Error('--batch debe ser un entero entre 1 y 100')
  }
  if (!await pathExists(databasePath)) throw new Error(`no existe SQLite: ${databasePath}`)
  if (isPathInside(uploadsPath, databasePath)) throw new Error('SQLite no puede estar dentro del directorio de uploads')
  if (isPathInside(uploadsPath, backupRoot)) throw new Error('el directorio de backups no puede estar dentro de uploads')

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')
  const backupPath = join(backupRoot, `pre-migration-${timestamp}`)
  const databaseMetadata = await stat(databasePath)
  const uploadFiles = await listUploadFiles(uploadsPath)
  const uploadsSize = uploadFiles.reduce((total, file) => total + file.size, 0)
  const before = inspectDatabase(databasePath)
  const estimatedGeneratedBytes = Math.ceil(before.inlineCharacters * 0.75) + before.inlineVariants * 1024 * 1024

  console.log(`[preflight] ${before.variants} variantes; ${before.inlineVariants} pendientes`)
  console.log(`[preflight] SQLite ${formatBytes(databaseMetadata.size)}; uploads ${formatBytes(uploadsSize)}`)
  await ensureEnoughSpace([
    { path: backupRoot, bytes: databaseMetadata.size + uploadsSize, label: 'backup previo' },
    { path: dirname(databasePath), bytes: databaseMetadata.size, label: 'compactacion SQLite' },
    { path: uploadsPath, bytes: estimatedGeneratedBytes, label: 'originales y thumbnails' }
  ])

  const confirmed = options.confirmApplicationStopped
    ? await options.confirmApplicationStopped({ databasePath, uploadsPath, backupPath })
    : await askForStoppedApplication({ databasePath, uploadsPath, backupPath })
  if (!confirmed) {
    console.log('\nMigracion cancelada. No se modificaron datos.')
    return { cancelled: true }
  }

  await mkdir(backupRoot, { recursive: true })
  const releaseLock = await acquireMigrationLock(databasePath)
  let backupCompleted = false
  try {
    console.log('\n[1/6] Creando backup verificado...')
    await createVerifiedBackup({ databasePath, uploadsPath, backupPath, uploadFiles })
    backupCompleted = true

    console.log('\n[2/6] Aplicando migraciones de esquema...')
    runSchemaMigration(databasePath)

    console.log('\n[3/6] Externalizando imagenes...')
    runImageMigration(databasePath, uploadsPath, batchSize)

    console.log('\n[4/6] Verificando datos y archivos...')
    runImageVerification(databasePath, uploadsPath)

    console.log('\n[5/6] Compactando SQLite...')
    await compactDatabase(databasePath, uploadsPath)

    console.log('\n[6/6] Verificacion final...')
    const after = inspectDatabase(databasePath)
    runImageVerification(databasePath, uploadsPath)
    if (after.inlineVariants !== 0) throw new Error(`${after.inlineVariants} variantes continuan inline`)
    if (after.variants !== before.variants) throw new Error('cambio el conteo de variantes')

    console.log('\nMigracion completada correctamente.')
    console.log(`Backup para rollback: ${backupPath}`)
    console.log(`Variantes verificadas: ${after.variants}`)
    console.log('Ahora inicia una sola instancia y prueba /api/health, /studio, /library, export y backup.')
    return { cancelled: false, backupPath, variants: after.variants }
  }
  catch (error) {
    console.error(`\nMIGRACION DETENIDA: ${error instanceof Error ? error.message : String(error)}`)
    if (backupCompleted) console.error(`Backup intacto para rollback: ${backupPath}`)
    throw error
  }
  finally {
    await releaseLock()
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(scriptPath)) {
  try {
    await migrateProduction()
  }
  catch (error) {
    console.error(`\nERROR: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}

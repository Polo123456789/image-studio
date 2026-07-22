import { createHash, randomUUID } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { copyFile, mkdtemp, mkdir, open, readFile, readdir, rename, rm, stat, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import archiver from 'archiver'
import Database from 'better-sqlite3'
import Busboy from 'busboy'
import type { H3Event } from 'h3'
import sharp from 'sharp'
import unzipper from 'unzipper'

import { closeDbConnection, reopenDbConnection, sqliteFilePath } from '../db/client'
import { beginMaintenance, endMaintenance } from './maintenance'
import { uploadsRootDirectory } from './storage-paths'

const uploadsDirectoryPath = uploadsRootDirectory
const backupTempPrefix = join(tmpdir(), 'image-studio-backup-')
const backupFormatVersion = 2
function positiveLimit(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

const maxBackupUploadBytes = positiveLimit(process.env.IMAGE_STUDIO_BACKUP_MAX_BYTES, 2 * 1024 * 1024 * 1024)
const maxBackupEntryCount = positiveLimit(process.env.IMAGE_STUDIO_BACKUP_MAX_ENTRIES, 100_000)
const maxBackupExpandedBytes = positiveLimit(process.env.IMAGE_STUDIO_BACKUP_MAX_EXPANDED_BYTES, 10 * 1024 * 1024 * 1024)
const allowedZipPrefixes = ['manifest.json', 'db/local.db', 'uploads/']
const expectedSchemaHash = '4382c25fb2e2cdc720c50476b3ec98361f8cc547da09aba42a217a8088d85de2'

interface BackupManifest {
  app: 'image-studio'
  formatVersion: number
  exportedAt: string
  includesApiKey: boolean
  sqliteFile: string
  uploadsDirectory: string
}

export interface StagedBackupFile {
  filePath: string
  name: string
  size: number
  cleanup: () => Promise<void>
}

let restoreInProgress = false

function createManifest(): BackupManifest {
  return {
    app: 'image-studio',
    formatVersion: backupFormatVersion,
    exportedAt: new Date().toISOString(),
    includesApiKey: true,
    sqliteFile: 'db/local.db',
    uploadsDirectory: 'uploads'
  }
}

function getBackupFileName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')

  return `image-studio-backup-${stamp}.zip`
}

async function pathExists(path: string) {
  try {
    await stat(path)
    return true
  }
  catch {
    return false
  }
}

function validateManifest(manifest: unknown): BackupManifest {
  if (!manifest || typeof manifest !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'El backup no incluye un manifest valido.'
    })
  }

  const candidate = manifest as Partial<BackupManifest>

  if (candidate.app !== 'image-studio' || candidate.formatVersion !== backupFormatVersion) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El backup no es compatible con esta version del estudio.'
    })
  }

  if (!candidate.sqliteFile || !candidate.uploadsDirectory) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El backup no incluye las rutas requeridas.'
    })
  }

  return candidate as BackupManifest
}

async function fsyncDirectory(directoryPath: string) {
  const directoryHandle = await open(directoryPath, 'r')
  try {
    await directoryHandle.sync()
  }
  finally {
    await directoryHandle.close()
  }
}

async function replaceFileAtomically(sourcePath: string, targetPath: string) {
  await mkdir(dirname(targetPath), { recursive: true })
  const temporaryPath = join(dirname(targetPath), `.${basename(targetPath)}.${randomUUID()}.restore`)
  await copyFile(sourcePath, temporaryPath)

  const fileHandle = await open(temporaryPath, 'r+')
  try {
    await fileHandle.sync()
  }
  finally {
    await fileHandle.close()
  }
  try {
    await rename(temporaryPath, targetPath)
    await fsyncDirectory(dirname(targetPath))
  }
  catch (error) {
    await unlink(temporaryPath).catch(() => undefined)
    throw error
  }
  await unlink(sourcePath)
}

async function hashFile(filePath: string) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(filePath)) hash.update(chunk as Buffer)
  return hash.digest('hex')
}

async function copyFileAtomically(sourcePath: string, targetPath: string) {
  await mkdir(dirname(targetPath), { recursive: true })
  if (await pathExists(targetPath)) {
    const [sourceStat, targetStat] = await Promise.all([stat(sourcePath), stat(targetPath)])
    if (sourceStat.size === targetStat.size && await hashFile(sourcePath) === await hashFile(targetPath)) return
    throw createError({
      statusCode: 409,
      statusMessage: 'El backup entra en conflicto con un archivo existente.'
    })
  }

  const temporaryPath = `${targetPath}.${randomUUID()}.restore`
  await copyFile(sourcePath, temporaryPath)
  const handle = await open(temporaryPath, 'r+')
  try {
    await handle.sync()
  }
  finally {
    await handle.close()
  }
  try {
    await rename(temporaryPath, targetPath)
    await fsyncDirectory(dirname(targetPath))
  }
  catch (error) {
    await unlink(temporaryPath).catch(() => undefined)
    throw error
  }
}

async function mergeDirectoryContents(sourcePath: string, targetPath: string) {
  await mkdir(targetPath, { recursive: true })
  if (!await pathExists(sourcePath)) return

  for (const entry of await readdir(sourcePath, { withFileTypes: true })) {
    const sourceEntryPath = join(sourcePath, entry.name)
    const targetEntryPath = join(targetPath, entry.name)
    if (entry.isDirectory()) await mergeDirectoryContents(sourceEntryPath, targetEntryPath)
    else if (entry.isFile()) await copyFileAtomically(sourceEntryPath, targetEntryPath)
    else throw createError({ statusCode: 400, statusMessage: 'El backup contiene un tipo de archivo no permitido.' })
  }
}

function assertSafeZipPath(entryName: string) {
  const hasParentSegment = entryName.split('/').some(segment => segment === '..')

  if (!entryName || hasParentSegment || entryName.includes('\\') || entryName.startsWith('/')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El backup contiene rutas no permitidas.'
    })
  }

  if (!allowedZipPrefixes.some((prefix) => entryName === prefix || entryName.startsWith(prefix))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El backup contiene archivos fuera del formato permitido.'
    })
  }
}

function validateZipEntries(entries: Array<{ path: string, uncompressedSize: number }>) {
  if (!entries.length || entries.length > maxBackupEntryCount) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El backup tiene una cantidad invalida de archivos.'
    })
  }

  let expandedBytes = 0

  entries.forEach((entry) => {
    assertSafeZipPath(entry.path)

    expandedBytes += entry.uncompressedSize

    if (expandedBytes > maxBackupExpandedBytes) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El backup supera el tamano maximo permitido al descomprimirse.'
      })
    }
  })
}

async function inspectArchiveInput(sqliteSnapshotPath: string, manifest: BackupManifest) {
  let entryCount = 2
  let expandedBytes = Buffer.byteLength(JSON.stringify(manifest, null, 2)) + (await stat(sqliteSnapshotPath)).size

  async function walk(directoryPath: string) {
    if (!await pathExists(directoryPath)) return
    for (const entry of await readdir(directoryPath, { withFileTypes: true })) {
      entryCount += 1
      if (entryCount > maxBackupEntryCount) {
        throw createError({ statusCode: 413, statusMessage: 'El estudio supera la cantidad configurada de archivos para backups.' })
      }
      const entryPath = join(directoryPath, entry.name)
      if (entry.isDirectory()) await walk(entryPath)
      else if (entry.isFile()) expandedBytes += (await stat(entryPath)).size
      else throw createError({ statusCode: 400, statusMessage: 'Uploads contiene un tipo de archivo no permitido.' })
      if (expandedBytes > maxBackupExpandedBytes) {
        throw createError({ statusCode: 413, statusMessage: 'El estudio supera el tamano expandido configurado para backups.' })
      }
    }
  }

  await walk(uploadsDirectoryPath)
}

async function createStreamingZip(zipPath: string, sqliteSnapshotPath: string, manifest: BackupManifest) {
  const output = createWriteStream(zipPath, { flags: 'wx' })
  const archive = archiver('zip', { zlib: { level: 6 } })
  const completed = new Promise<void>((resolveCompletion, rejectCompletion) => {
    output.once('close', resolveCompletion)
    output.once('error', rejectCompletion)
    archive.once('error', rejectCompletion)
    archive.on('warning', (error: Error) => rejectCompletion(error))
  })

  archive.pipe(output)
  archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' })
  archive.file(sqliteSnapshotPath, { name: 'db/local.db' })
  if (await pathExists(uploadsDirectoryPath)) archive.directory(uploadsDirectoryPath, 'uploads')
  await archive.finalize()
  await completed
}

async function extractStreamingZip(zipPath: string, extractedRootPath: string) {
  const directory = await unzipper.Open.file(zipPath)
  const entries = directory.files.map(entry => ({
    path: entry.path,
    uncompressedSize: entry.uncompressedSize
  }))
  validateZipEntries(entries)
  let expandedBytes = 0

  for (const entry of directory.files) {
    assertSafeZipPath(entry.path)
    const targetPath = resolve(extractedRootPath, entry.path)
    const relativeTargetPath = relative(extractedRootPath, targetPath)
    if (!relativeTargetPath || relativeTargetPath.startsWith('..')) {
      throw createError({ statusCode: 400, statusMessage: 'El backup contiene rutas no permitidas.' })
    }
    if (entry.type === 'Directory') {
      await mkdir(targetPath, { recursive: true })
      continue
    }

    await mkdir(dirname(targetPath), { recursive: true })
    const limitExpandedBytes = new Transform({
      transform(chunk, _encoding, callback) {
        expandedBytes += chunk.length
        if (expandedBytes > maxBackupExpandedBytes) {
          callback(createError({ statusCode: 400, statusMessage: 'El backup supera el tamano expandido configurado.' }))
          return
        }
        callback(null, chunk)
      }
    })
    await pipeline(entry.stream(), limitExpandedBytes, createWriteStream(targetPath, { flags: 'wx' }))
  }
}

function validateExtractedSqliteFile(sqlitePath: string) {
  const sqlite = new Database(sqlitePath, { readonly: true })

  try {
    const integrity = sqlite.pragma('integrity_check', { simple: true })
    const foreignKeyFailures = sqlite.pragma('foreign_key_check') as unknown[]
    const requiredSchema: Record<string, string[]> = {
      app_settings: ['id', 'gemini_api_key', 'concept_generator_prompt', 'image_generator_prompt', 'style_guide_reverse_engineering_prompt', 'created_at', 'updated_at'],
      brands: ['id', 'name', 'description', 'default_style_guide_id', 'created_at', 'updated_at'],
      style_guides: ['id', 'name', 'content', 'brand_id', 'created_at', 'updated_at'],
      assets: ['id', 'name', 'original_file_name', 'file_path', 'mime_type', 'file_size', 'hash', 'description', 'tags', 'brand_id', 'created_at', 'updated_at'],
      creative_styles: ['id', 'name', 'description', 'reference_image_path', 'position', 'is_active', 'created_at', 'updated_at'],
      studio_projects: ['id', 'slug', 'project_name', 'brief', 'created_at', 'updated_at'],
      studio_concepts: ['id', 'project_id', 'concept_key', 'title', 'subtitle', 'rationale', 'creative_style_id', 'creative_style_name', 'approved_at', 'position', 'discarded_at', 'created_at', 'updated_at'],
      studio_concept_formats: ['id', 'concept_id', 'ratio', 'is_preview_source', 'prompt_draft', 'active_variant_key', 'created_at', 'updated_at'],
      studio_variants: ['id', 'format_id', 'variant_key', 'label', 'mode', 'prompt', 'image_url', 'thumbnail_url', 'image_mime_type', 'image_file_size', 'image_width', 'image_height', 'image_hash', 'created_at']
    }
    const hasInvalidSchema = Object.entries(requiredSchema).some(([table, requiredColumns]) => {
      const columnRows = sqlite.prepare(`pragma table_info(${table})`).all() as Array<{ name: string }>
      const columns = new Set(columnRows.map(row => row.name))
      return requiredColumns.some(column => !columns.has(column))
    })

    const requiredIndexes = [
      'assets_hash_unique',
      'creative_styles_name_unique',
      'studio_concept_formats_concept_id_ratio_unique',
      'studio_concepts_project_id_concept_key_unique',
      'studio_projects_slug_unique',
      'studio_variants_format_id_variant_key_unique',
      'studio_variants_image_hash_index',
      'style_guides_name_brand_unique'
    ]
    const indexes = new Set((sqlite.prepare("select name from sqlite_master where type = 'index'").all() as Array<{ name: string }>).map(row => row.name))
    const requiredForeignKeys: Record<string, string[]> = {
      style_guides: ['brand_id:brands:id'],
      assets: ['brand_id:brands:id'],
      studio_concepts: ['project_id:studio_projects:id', 'creative_style_id:creative_styles:id'],
      studio_concept_formats: ['concept_id:studio_concepts:id'],
      studio_variants: ['format_id:studio_concept_formats:id']
    }
    const hasInvalidForeignKeys = Object.entries(requiredForeignKeys).some(([table, requiredKeys]) => {
      const rows = sqlite.prepare(`pragma foreign_key_list(${table})`).all() as Array<{ from: string, table: string, to: string }>
      const keys = new Set(rows.map(row => `${row.from}:${row.table}:${row.to}`))
      return requiredKeys.some(key => !keys.has(key))
    })
    const schemaRows = sqlite.prepare(`
      select type, name, tbl_name, sql
      from sqlite_master
      where name not like 'sqlite_%' and name != '__drizzle_migrations'
      order by type, name
    `).all()
    const schemaHash = createHash('sha256').update(JSON.stringify(schemaRows)).digest('hex')

    if (
      integrity !== 'ok'
      || foreignKeyFailures.length
      || hasInvalidSchema
      || hasInvalidForeignKeys
      || requiredIndexes.some(index => !indexes.has(index))
      || schemaHash !== expectedSchemaHash
    ) {
      throw new Error('invalid backup database')
    }
  }
  catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'La base de datos incluida en el backup no es valida.'
    })
  }
  finally {
    sqlite.close()
  }
}

function resolveReferencedUpload(uploadsPath: string, publicPath: string, expectedPrefix: string) {
  if (!publicPath.startsWith(expectedPrefix)) throw new Error(`invalid upload path: ${publicPath}`)
  const filePath = resolve(uploadsPath, publicPath.slice('/uploads/'.length))
  const pathRelativeToUploads = relative(uploadsPath, filePath)
  if (!pathRelativeToUploads || pathRelativeToUploads.startsWith('..')) throw new Error(`upload escapes root: ${publicPath}`)
  return filePath
}

async function validateExtractedUploads(sqlitePath: string, uploadsPath: string) {
  const sqlite = new Database(sqlitePath, { readonly: true })

  try {
    const rows = sqlite.prepare(`
      select id, image_url, thumbnail_url, image_hash, image_mime_type,
             image_file_size, image_width, image_height
      from studio_variants
      order by id
    `).all() as Array<{
      id: number
      image_url: string
      thumbnail_url: string | null
      image_hash: string | null
      image_mime_type: string | null
      image_file_size: number | null
      image_width: number | null
      image_height: number | null
    }>

    for (const row of rows) {
      if (row.image_url.startsWith('data:') || !row.thumbnail_url || !row.image_hash) {
        throw new Error(`variant ${row.id} is not externalized`)
      }

      const originalPath = resolveReferencedUpload(uploadsPath, row.image_url, '/uploads/generated/')
      const thumbnailPath = resolveReferencedUpload(uploadsPath, row.thumbnail_url, '/uploads/generated/')
      const [originalStat, originalMetadata, thumbnailMetadata, actualHash] = await Promise.all([
        stat(originalPath),
        sharp(originalPath, { failOn: 'error' }).metadata(),
        sharp(thumbnailPath, { failOn: 'error' }).metadata(),
        hashFile(originalPath)
      ])
      const originalMimeType = originalMetadata.format === 'png' ? 'image/png' : originalMetadata.format === 'jpeg' ? 'image/jpeg' : null
      if (
        actualHash !== row.image_hash
        || originalMimeType !== row.image_mime_type
        || originalStat.size !== row.image_file_size
        || originalMetadata.width !== row.image_width
        || originalMetadata.height !== row.image_height
      ) throw new Error(`variant ${row.id} metadata mismatch`)
      if (
        thumbnailMetadata.format !== 'webp'
        || !thumbnailMetadata.width
        || !thumbnailMetadata.height
        || thumbnailMetadata.width > 512
        || thumbnailMetadata.height > 512
      ) throw new Error(`variant ${row.id} thumbnail invalid`)
    }

    const assetRows = sqlite.prepare('select id, file_path, hash from assets order by id').all() as Array<{ id: number, file_path: string, hash: string }>
    for (const asset of assetRows) {
      const filePath = resolveReferencedUpload(uploadsPath, asset.file_path, '/uploads/assets/')
      const actualHash = await hashFile(filePath)
      if (actualHash !== asset.hash) throw new Error(`asset ${asset.id} hash mismatch`)
    }

    const referenceRows = sqlite.prepare(`
      select id, reference_image_path
      from creative_styles
      where reference_image_path is not null
      order by id
    `).all() as Array<{ id: number, reference_image_path: string }>
    for (const reference of referenceRows) {
      await stat(resolveReferencedUpload(uploadsPath, reference.reference_image_path, '/uploads/creative-styles/'))
    }
  }
  catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'El backup no contiene todos los archivos referenciados o sus hashes no coinciden.'
    })
  }
  finally {
    sqlite.close()
  }
}

async function createConsistentSqliteSnapshot(targetPath: string) {
  await mkdir(dirname(targetPath), { recursive: true })
  const sqlite = new Database(sqliteFilePath, { readonly: true, fileMustExist: true })
  try {
    await sqlite.backup(targetPath)
  }
  finally {
    sqlite.close()
  }
}

async function removeSqliteSidecars(databasePath: string) {
  await Promise.all([
    rm(`${databasePath}-wal`, { force: true }),
    rm(`${databasePath}-shm`, { force: true })
  ])
}

async function createRollbackSnapshot(snapshotRootPath: string) {
  const dbSnapshotPath = join(snapshotRootPath, 'db', 'local.db')
  await createConsistentSqliteSnapshot(dbSnapshotPath)
}

async function restoreFromSnapshot(snapshotRootPath: string) {
  const dbSnapshotPath = join(snapshotRootPath, 'db', 'local.db')
  await removeSqliteSidecars(sqliteFilePath)
  await replaceFileAtomically(dbSnapshotPath, sqliteFilePath)
}

function ensureNoRestoreInProgress() {
  if (restoreInProgress) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ya hay una restauracion en curso.'
    })
  }
}

export function getBackupRestoreState() {
  return {
    restoreInProgress
  }
}

export async function createFullBackupArchive() {
  await beginMaintenance('backup')
  let workingRootPath = ''
  let succeeded = false
  try {
    workingRootPath = await mkdtemp(backupTempPrefix)
    const sqliteSnapshotPath = join(workingRootPath, 'local.db')
    const zipPath = join(workingRootPath, 'backup.zip')
    const manifest = createManifest()

    await createConsistentSqliteSnapshot(sqliteSnapshotPath)
    await validateExtractedUploads(sqliteSnapshotPath, uploadsDirectoryPath)
    await inspectArchiveInput(sqliteSnapshotPath, manifest)
    await createStreamingZip(zipPath, sqliteSnapshotPath, manifest)
    const archiveSize = (await stat(zipPath)).size

    if (archiveSize > maxBackupUploadBytes) {
      throw createError({ statusCode: 413, statusMessage: 'El estudio supera el limite configurado para backups.' })
    }

    succeeded = true
    return {
      fileName: getBackupFileName(),
      filePath: zipPath,
      size: archiveSize,
      cleanup: () => rm(workingRootPath, { recursive: true, force: true })
    }
  }
  finally {
    if (workingRootPath && !succeeded) await rm(workingRootPath, { recursive: true, force: true })
    endMaintenance('backup')
  }
}

export async function importFullBackupArchive(file: File | StagedBackupFile) {
  ensureNoRestoreInProgress()

  restoreInProgress = true
  let maintenanceStarted = false
  let workingRootPath = ''

  try {
    await beginMaintenance('restore')
    maintenanceStarted = true
    workingRootPath = await mkdtemp(backupTempPrefix)

    const extractedRootPath = join(workingRootPath, 'extracted')
    const rollbackRootPath = join(workingRootPath, 'rollback')
    const incomingDbPath = join(extractedRootPath, 'db', 'local.db')
    const incomingUploadsPath = join(extractedRootPath, 'uploads')
    const incomingZipPath = 'filePath' in file ? file.filePath : join(workingRootPath, 'incoming.zip')
    if (!('filePath' in file)) {
      await pipeline(
        Readable.from(file.stream() as unknown as AsyncIterable<Uint8Array>),
        createWriteStream(incomingZipPath, { flags: 'wx' })
      )
    }
    if ((await stat(incomingZipPath)).size > maxBackupUploadBytes) {
      throw createError({ statusCode: 400, statusMessage: 'El backup supera el tamano maximo configurado.' })
    }
    await extractStreamingZip(incomingZipPath, extractedRootPath)

    const manifestPath = join(extractedRootPath, 'manifest.json')
    if (!await pathExists(manifestPath)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El backup no incluye manifest.json.'
      })
    }

    const manifest = validateManifest(JSON.parse(await readFile(manifestPath, 'utf8')))

    if (!await pathExists(incomingDbPath)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El backup no incluye la base de datos local.'
      })
    }

    if (!await pathExists(incomingUploadsPath)) {
      await mkdir(incomingUploadsPath, { recursive: true })
    }

    const extractedDbPath = resolve(extractedRootPath, manifest.sqliteFile)
    const extractedUploadsPath = resolve(extractedRootPath, manifest.uploadsDirectory)

    if (extractedDbPath !== incomingDbPath || extractedUploadsPath !== incomingUploadsPath) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El manifest del backup no coincide con la estructura esperada.'
      })
    }

    validateExtractedSqliteFile(incomingDbPath)
    await validateExtractedUploads(incomingDbPath, incomingUploadsPath)

    await createRollbackSnapshot(rollbackRootPath)

    let reopenAttempted = false

    closeDbConnection()

    try {
      await removeSqliteSidecars(sqliteFilePath)
      await mergeDirectoryContents(incomingUploadsPath, uploadsDirectoryPath)
      await replaceFileAtomically(incomingDbPath, sqliteFilePath)
      reopenDbConnection()
      reopenAttempted = true
    }
    catch (error) {
      try {
        await restoreFromSnapshot(rollbackRootPath)
      }
      finally {
        if (!reopenAttempted) {
          reopenDbConnection()
        }
      }

      throw error
    }
  }
  finally {
    restoreInProgress = false
    if (maintenanceStarted) endMaintenance('restore')

    if (workingRootPath) {
      await rm(workingRootPath, { recursive: true, force: true })
    }
  }
}

export async function stageBackupFileFromRequest(event: H3Event): Promise<StagedBackupFile> {
  const workingRootPath = await mkdtemp(backupTempPrefix)
  const filePath = join(workingRootPath, 'upload.zip')

  try {
    const parser = Busboy({
      headers: event.node.req.headers,
      limits: { files: 1, fileSize: maxBackupUploadBytes, fields: 4, parts: 5 }
    })
    let fileName = ''
    let fileSize = 0
    let fileCount = 0
    let uploadError: Error | null = null
    const writes: Array<Promise<void>> = []

    await new Promise<void>((resolveUpload, rejectUpload) => {
      parser.on('file', (fieldName, fileStream, info) => {
        fileCount += 1
        if (fieldName !== 'backup' || fileCount > 1) {
          uploadError = createError({ statusCode: 400, statusMessage: 'El formulario de backup no es valido.' })
          fileStream.resume()
          return
        }
        fileName = info.filename
        const countBytes = new Transform({
          transform(chunk, _encoding, callback) {
            fileSize += chunk.length
            callback(null, chunk)
          }
        })
        fileStream.once('limit', () => {
          uploadError = createError({ statusCode: 400, statusMessage: 'El backup supera el tamano maximo configurado.' })
        })
        writes.push(pipeline(fileStream, countBytes, createWriteStream(filePath, { flags: 'wx' })))
      })
      parser.once('filesLimit', () => {
        uploadError = createError({ statusCode: 400, statusMessage: 'Solo se permite un archivo de backup.' })
      })
      parser.once('partsLimit', () => {
        uploadError = createError({ statusCode: 400, statusMessage: 'El formulario de backup supera los limites permitidos.' })
      })
      parser.once('error', rejectUpload)
      parser.once('finish', () => {
        Promise.all(writes).then(() => resolveUpload(), rejectUpload)
      })
      event.node.req.pipe(parser)
    })

    if (uploadError) throw uploadError
    if (fileCount !== 1 || !fileSize) {
      throw createError({ statusCode: 400, statusMessage: 'Selecciona un archivo de backup valido.' })
    }
    if (!fileName.toLowerCase().endsWith('.zip')) {
      throw createError({ statusCode: 400, statusMessage: 'El archivo debe ser un ZIP exportado por Image Studio.' })
    }

    return {
      filePath,
      name: fileName,
      size: fileSize,
      cleanup: () => rm(workingRootPath, { recursive: true, force: true })
    }
  }
  catch (error) {
    await rm(workingRootPath, { recursive: true, force: true })
    throw error
  }
}

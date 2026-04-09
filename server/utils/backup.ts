import { cp, mkdtemp, mkdir, rename, rm, stat, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'

import AdmZip from 'adm-zip'
import Database from 'better-sqlite3'

import { closeDbConnection, reopenDbConnection, sqliteFilePath } from '../db/client'

const uploadsDirectoryPath = resolve(process.cwd(), 'public/uploads/assets')
const backupTempPrefix = join(tmpdir(), 'image-studio-backup-')
const backupFormatVersion = 1
const maxBackupUploadBytes = 250 * 1024 * 1024
const maxBackupEntryCount = 5000
const maxBackupExpandedBytes = 1024 * 1024 * 1024
const allowedZipPrefixes = ['manifest.json', 'db/local.db', 'uploads/assets/']

interface BackupManifest {
  app: 'image-studio'
  formatVersion: number
  exportedAt: string
  includesApiKey: boolean
  sqliteFile: string
  uploadsDirectory: string
}

let restoreInProgress = false

function createManifest(): BackupManifest {
  return {
    app: 'image-studio',
    formatVersion: backupFormatVersion,
    exportedAt: new Date().toISOString(),
    includesApiKey: true,
    sqliteFile: 'db/local.db',
    uploadsDirectory: 'uploads/assets'
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

async function addDirectoryToZip(zip: AdmZip, sourceDirectoryPath: string, zipDirectoryPath: string) {
  if (!await pathExists(sourceDirectoryPath)) {
    return
  }

  zip.addLocalFolder(sourceDirectoryPath, zipDirectoryPath)
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

async function replacePath(sourcePath: string, targetPath: string) {
  await rm(targetPath, { recursive: true, force: true })
  await mkdir(dirname(targetPath), { recursive: true })

  try {
    await rename(sourcePath, targetPath)
  }
  catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'EXDEV') {
      throw error
    }

    await cp(sourcePath, targetPath, { recursive: true })
    await rm(sourcePath, { recursive: true, force: true })
  }
}

function assertSafeZipPath(entryName: string) {
  if (!entryName || entryName.includes('..') || entryName.startsWith('/') || entryName.startsWith('\\')) {
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

function validateZipEntries(zip: AdmZip) {
  const entries = zip.getEntries()

  if (!entries.length || entries.length > maxBackupEntryCount) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El backup tiene una cantidad invalida de archivos.'
    })
  }

  let expandedBytes = 0

  entries.forEach((entry) => {
    assertSafeZipPath(entry.entryName)

    expandedBytes += entry.header.size

    if (expandedBytes > maxBackupExpandedBytes) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El backup supera el tamano maximo permitido al descomprimirse.'
      })
    }
  })
}

function validateExtractedSqliteFile(sqlitePath: string) {
  const sqlite = new Database(sqlitePath, { readonly: true })

  try {
    sqlite.prepare('select name from sqlite_master limit 1').get()
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

async function createRollbackSnapshot(snapshotRootPath: string) {
  const dbSnapshotPath = join(snapshotRootPath, 'db', 'local.db')
  const uploadsSnapshotPath = join(snapshotRootPath, 'uploads', 'assets')

  await mkdir(dirname(dbSnapshotPath), { recursive: true })
  await cp(sqliteFilePath, dbSnapshotPath)

  if (await pathExists(uploadsDirectoryPath)) {
    await mkdir(dirname(uploadsSnapshotPath), { recursive: true })
    await cp(uploadsDirectoryPath, uploadsSnapshotPath, { recursive: true })
  }
}

async function restoreFromSnapshot(snapshotRootPath: string) {
  const dbSnapshotPath = join(snapshotRootPath, 'db', 'local.db')
  const uploadsSnapshotPath = join(snapshotRootPath, 'uploads', 'assets')

  await replacePath(dbSnapshotPath, sqliteFilePath)

  if (await pathExists(uploadsSnapshotPath)) {
    await replacePath(uploadsSnapshotPath, uploadsDirectoryPath)
    return
  }

  await rm(uploadsDirectoryPath, { recursive: true, force: true })
  await mkdir(uploadsDirectoryPath, { recursive: true })
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
  const zip = new AdmZip()
  const manifest = createManifest()

  zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'))
  zip.addLocalFile(sqliteFilePath, 'db', 'local.db')
  await addDirectoryToZip(zip, uploadsDirectoryPath, 'uploads/assets')

  return {
    fileName: getBackupFileName(),
    buffer: zip.toBuffer()
  }
}

export async function importFullBackupArchive(file: File) {
  ensureNoRestoreInProgress()

  restoreInProgress = true
  let workingRootPath = ''

  try {
    workingRootPath = await mkdtemp(backupTempPrefix)

    const extractedRootPath = join(workingRootPath, 'extracted')
    const rollbackRootPath = join(workingRootPath, 'rollback')
    const incomingDbPath = join(extractedRootPath, 'db', 'local.db')
    const incomingUploadsPath = join(extractedRootPath, 'uploads', 'assets')
    const inputBuffer = Buffer.from(await file.arrayBuffer())
    const zip = new AdmZip(inputBuffer)
    validateZipEntries(zip)
    const manifestEntry = zip.getEntry('manifest.json')

    if (!manifestEntry) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El backup no incluye manifest.json.'
      })
    }

    const manifest = validateManifest(JSON.parse(zip.readAsText(manifestEntry)))

    zip.extractAllTo(extractedRootPath, true)

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

    await createRollbackSnapshot(rollbackRootPath)

    let reopenAttempted = false

    closeDbConnection()

    try {
      await replacePath(incomingDbPath, sqliteFilePath)
      await replacePath(incomingUploadsPath, uploadsDirectoryPath)
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

    if (workingRootPath) {
      await rm(workingRootPath, { recursive: true, force: true })
    }
  }
}

export async function readBackupFileFromFormData(formData: FormData) {
  const backup = formData.get('backup')

  if (!(backup instanceof File) || !backup.size) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Selecciona un archivo de backup valido.'
    })
  }

  if (backup.size > maxBackupUploadBytes) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El backup supera el tamano maximo permitido de 250 MB.'
    })
  }

  if (!backup.name.toLowerCase().endsWith('.zip')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El archivo debe ser un ZIP exportado por Image Studio.'
    })
  }

  return backup
}

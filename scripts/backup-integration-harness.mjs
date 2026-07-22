import { readFile, rename, rm, stat } from 'node:fs/promises'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import AdmZip from 'adm-zip'
import Database from 'better-sqlite3'
import { createJiti } from 'jiti'

Object.assign(globalThis, {
  createError: input => Object.assign(new Error(input.statusMessage), input)
})

const databasePath = process.env.IMAGE_STUDIO_DB_PATH
const uploadsRoot = process.env.IMAGE_STUDIO_UPLOADS_ROOT
const assetPath = join(uploadsRoot, 'assets', 'asset.png')
const hiddenAssetPath = `${assetPath}.missing`

const jiti = createJiti(import.meta.url, { interopDefault: true })
const backup = jiti('../server/utils/backup.ts')

await rename(assetPath, hiddenAssetPath)
let missingFileRejected = false
try {
  await backup.createFullBackupArchive()
}
catch {
  missingFileRejected = true
}
finally {
  await rename(hiddenAssetPath, assetPath)
}

const archive = await backup.createFullBackupArchive()
const archiveBuffer = await readFile(archive.filePath)
await archive.cleanup()
const corruptedZip = new AdmZip(archiveBuffer)
corruptedZip.deleteFile('uploads/assets/asset.png')
let corruptImportRejected = false
try {
  await backup.importFullBackupArchive(new File([corruptedZip.toBuffer()], 'corrupt.zip', { type: 'application/zip' }))
}
catch {
  corruptImportRejected = true
}

const sqlite = new Database(databasePath)
sqlite.prepare("update studio_projects set project_name = 'mutado' where id = 1").run()
sqlite.close()
await rm(join(uploadsRoot, 'generated'), { recursive: true, force: true })
const rootInodeBefore = (await stat(uploadsRoot)).ino

await backup.importFullBackupArchive(new File([archiveBuffer], archive.fileName, { type: 'application/zip' }))

const restoredSqlite = new Database(databasePath, { readonly: true })
const projectName = restoredSqlite.prepare('select project_name from studio_projects where id = 1').pluck().get()
restoredSqlite.close()

const result = JSON.stringify({
  missingFileRejected,
  corruptImportRejected,
  projectName,
  rootMountPointPreserved: (await stat(uploadsRoot)).ino === rootInodeBefore,
  originalRestored: Boolean(await stat(join(uploadsRoot, 'generated', 'originals', 'aa', 'original.png'))),
  maintenanceReleased: backup.getBackupRestoreState().restoreInProgress === false
})
if (process.env.TEST_RESULT_PATH) writeFileSync(process.env.TEST_RESULT_PATH, result)
else process.stdout.write(`${result}\n`)

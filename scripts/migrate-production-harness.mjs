import { writeFile } from 'node:fs/promises'

import { migrateProduction } from './migrate-production.mjs'

const result = await migrateProduction({
  databasePath: process.env.TEST_DATABASE_PATH,
  uploadsPath: process.env.TEST_UPLOADS_PATH,
  backupRoot: process.env.TEST_BACKUP_ROOT,
  batchSize: 1,
  confirmApplicationStopped: async () => process.env.TEST_CONFIRMATION === 'SI'
})

await writeFile(process.env.TEST_RESULT_PATH, JSON.stringify(result))

import type { BackupImportResponse } from '../../../shared/types/backup'

import { importFullBackupArchive, stageBackupFileFromRequest } from '../../utils/backup'
import { requireSameOriginRequest } from '../../utils/http'

export default defineEventHandler(async (event): Promise<BackupImportResponse> => {
  requireSameOriginRequest(event)

  const backup = await stageBackupFileFromRequest(event)
  try {
    await importFullBackupArchive(backup)
  }
  finally {
    await backup.cleanup()
  }

  return {
    restored: true
  }
})

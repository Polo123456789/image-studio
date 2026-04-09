import type { BackupImportResponse } from '../../../shared/types/backup'

import { importFullBackupArchive, readBackupFileFromFormData } from '../../utils/backup'
import { requireSameOriginRequest } from '../../utils/http'

export default defineEventHandler(async (event): Promise<BackupImportResponse> => {
  requireSameOriginRequest(event)

  const formData = await readFormData(event)
  const backup = await readBackupFileFromFormData(formData)

  await importFullBackupArchive(backup)

  return {
    restored: true
  }
})

import type { BackupStatusResponse } from '../../../shared/types/backup'

import { getBackupRestoreState } from '../../utils/backup'
import { requireSameOriginRequest } from '../../utils/http'

export default defineEventHandler((event): BackupStatusResponse => {
  requireSameOriginRequest(event)

  return getBackupRestoreState()
})

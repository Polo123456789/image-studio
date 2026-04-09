import { createFullBackupArchive } from '../../utils/backup'
import { requireSameOriginRequest } from '../../utils/http'

export default defineEventHandler(async (event) => {
  requireSameOriginRequest(event)

  const backup = await createFullBackupArchive()

  setHeader(event, 'Content-Type', 'application/zip')
  setHeader(event, 'Content-Disposition', `attachment; filename="${backup.fileName}"`)
  setHeader(event, 'Content-Length', backup.buffer.length)
  setHeader(event, 'Cache-Control', 'no-store')

  return backup.buffer
})

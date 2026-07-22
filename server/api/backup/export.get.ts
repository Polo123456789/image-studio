import { createReadStream } from 'node:fs'

import { createFullBackupArchive } from '../../utils/backup'
import { requireSameOriginRequest } from '../../utils/http'

export default defineEventHandler(async (event) => {
  requireSameOriginRequest(event)

  const backup = await createFullBackupArchive()

  setHeader(event, 'Content-Type', 'application/zip')
  setHeader(event, 'Content-Disposition', `attachment; filename="${backup.fileName}"`)
  setHeader(event, 'Content-Length', backup.size)
  setHeader(event, 'Cache-Control', 'no-store')

  const stream = createReadStream(backup.filePath)
  stream.once('close', () => void backup.cleanup())
  stream.once('error', () => void backup.cleanup())
  return sendStream(event, stream)
})

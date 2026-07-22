import { acquireApplicationRequest } from '../utils/maintenance'

export default defineEventHandler((event) => {
  if (event.path.startsWith('/api/backup/')) return

  const release = acquireApplicationRequest()
  event.node.res.once('finish', release)
  event.node.res.once('close', release)
})

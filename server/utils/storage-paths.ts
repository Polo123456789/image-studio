import { resolve } from 'node:path'

export const uploadsRootDirectory = resolve(
  process.cwd(),
  process.env.IMAGE_STUDIO_UPLOADS_ROOT || 'public/uploads'
)

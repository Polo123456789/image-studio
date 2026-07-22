import { resolve, sep } from 'node:path'

export const uploadsRootDirectory = resolve(
  process.cwd(),
  process.env.IMAGE_STUDIO_UPLOADS_ROOT || 'public/uploads'
)

export function resolvePathInsideDirectory(directory: string, requestedPath: string) {
  const normalizedDirectory = resolve(directory)
  const absolutePath = resolve(normalizedDirectory, requestedPath)

  if (absolutePath === normalizedDirectory || !absolutePath.startsWith(`${normalizedDirectory}${sep}`)) {
    return null
  }

  return absolutePath
}

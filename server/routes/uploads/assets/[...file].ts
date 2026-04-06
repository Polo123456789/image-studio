import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'

import { assetsDirectory } from '../../../utils/assets'

const mimeTypesByExtension: Record<string, string> = {
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
}

function getUploadMimeType(filePath: string) {
  return mimeTypesByExtension[extname(filePath).toLowerCase()] || 'application/octet-stream'
}

function resolveRequestedAssetPath(requestedPath: string) {
  const absoluteFilePath = resolve(assetsDirectory, requestedPath)
  const normalizedAssetsDirectory = `${assetsDirectory}${sep}`

  if (absoluteFilePath !== assetsDirectory && !absoluteFilePath.startsWith(normalizedAssetsDirectory)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Asset not found'
    })
  }

  return absoluteFilePath
}

export default defineEventHandler(async (event) => {
  const requestedFile = getRouterParam(event, 'file')?.trim()

  if (!requestedFile) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Asset not found'
    })
  }

  const absoluteFilePath = resolveRequestedAssetPath(requestedFile)

  try {
    const buffer = await readFile(absoluteFilePath)

    setHeader(event, 'Content-Type', getUploadMimeType(absoluteFilePath))
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

    return buffer
  }
  catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Asset not found'
      })
    }

    throw error
  }
})

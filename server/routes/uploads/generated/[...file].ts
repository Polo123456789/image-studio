import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'

import { resolveGeneratedImagePath } from '../../../utils/generated-images'

const mimeTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
}

export default defineEventHandler(async (event) => {
  const requestedFile = getRouterParam(event, 'file')?.trim()

  if (!requestedFile) {
    throw createError({ statusCode: 404, statusMessage: 'Imagen no encontrada.' })
  }

  const filePath = resolveGeneratedImagePath(`/uploads/generated/${requestedFile}`)

  try {
    const data = await readFile(filePath)
    setHeader(event, 'Content-Type', mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream')
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    return data
  }
  catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw createError({ statusCode: 404, statusMessage: 'Imagen no encontrada.' })
    }
    throw error
  }
})

import { createHash, randomUUID } from 'node:crypto'
import { mkdir, open, readFile, rename, stat, unlink } from 'node:fs/promises'
import { dirname, extname, relative, resolve, sep } from 'node:path'

import sharp from 'sharp'

import { uploadsRootDirectory } from './storage-paths'

export type StudioImageMimeType = 'image/jpeg' | 'image/png'

export interface StoredStudioImage {
  imageUrl: string
  thumbnailUrl: string
  imageMimeType: StudioImageMimeType
  imageFileSize: number
  imageWidth: number
  imageHeight: number
  imageHash: string
}

export const generatedImagesDirectory = resolve(uploadsRootDirectory, 'generated')

function publicGeneratedUrl(relativePath: string) {
  return `/uploads/generated/${relativePath.replaceAll('\\', '/')}`
}

function getActualImageFormat(format?: string): { extension: '.jpg' | '.png', mimeType: StudioImageMimeType } {
  if (format === 'jpeg') {
    return { extension: '.jpg', mimeType: 'image/jpeg' }
  }

  if (format === 'png') {
    return { extension: '.png', mimeType: 'image/png' }
  }

  throw createError({
    statusCode: 502,
    statusMessage: 'La imagen generada no es un JPEG o PNG valido.'
  })
}

async function pathExists(filePath: string) {
  try {
    await stat(filePath)
    return true
  }
  catch {
    return false
  }
}

async function writeAtomic(filePath: string, data: Buffer) {
  await mkdir(dirname(filePath), { recursive: true })

  if (await pathExists(filePath)) {
    return false
  }

  const temporaryPath = `${filePath}.${randomUUID()}.tmp`
  const handle = await open(temporaryPath, 'wx')

  try {
    await handle.writeFile(data)
    await handle.sync()
  }
  finally {
    await handle.close()
  }

  try {
    await rename(temporaryPath, filePath)
    const directoryHandle = await open(dirname(filePath), 'r')
    try {
      await directoryHandle.sync()
    }
    finally {
      await directoryHandle.close()
    }
  }
  catch (error) {
    await unlink(temporaryPath).catch(() => undefined)

    if (!await pathExists(filePath)) {
      throw error
    }
  }

  return true
}

export async function inspectStudioImage(data: Buffer) {
  const metadata = await sharp(data, { failOn: 'error' }).metadata()
  const { extension, mimeType } = getActualImageFormat(metadata.format)

  if (!metadata.width || !metadata.height) {
    throw createError({
      statusCode: 502,
      statusMessage: 'La imagen generada no incluye dimensiones validas.'
    })
  }

  return {
    extension,
    mimeType,
    width: metadata.width,
    height: metadata.height,
    hash: createHash('sha256').update(data).digest('hex')
  }
}

export async function storeStudioImage(data: Buffer): Promise<StoredStudioImage> {
  const inspected = await inspectStudioImage(data)
  const shard = inspected.hash.slice(0, 2)
  const originalRelativePath = `originals/${shard}/${inspected.hash}${inspected.extension}`
  const thumbnailRelativePath = `thumbnails/${shard}/${inspected.hash}-v1.webp`
  const originalPath = resolve(generatedImagesDirectory, originalRelativePath)
  const thumbnailPath = resolve(generatedImagesDirectory, thumbnailRelativePath)

  await writeAtomic(originalPath, data)

  if (!await pathExists(thumbnailPath)) {
    const thumbnail = await sharp(data, { failOn: 'error' })
      .rotate()
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer()

    await writeAtomic(thumbnailPath, thumbnail)
  }

  const [storedOriginal, thumbnailMetadata] = await Promise.all([
    readFile(originalPath),
    sharp(thumbnailPath, { failOn: 'error' }).metadata()
  ])

  if (createHash('sha256').update(storedOriginal).digest('hex') !== inspected.hash || thumbnailMetadata.format !== 'webp') {
    throw createError({
      statusCode: 500,
      statusMessage: 'No se pudo verificar la imagen almacenada.'
    })
  }

  return {
    imageUrl: publicGeneratedUrl(originalRelativePath),
    thumbnailUrl: publicGeneratedUrl(thumbnailRelativePath),
    imageMimeType: inspected.mimeType,
    imageFileSize: data.length,
    imageWidth: inspected.width,
    imageHeight: inspected.height,
    imageHash: inspected.hash
  }
}

export function resolveGeneratedImagePath(imageUrl: string) {
  const prefix = '/uploads/generated/'

  if (!imageUrl.startsWith(prefix)) {
    throw createError({ statusCode: 400, statusMessage: 'Ruta de imagen no soportada.' })
  }

  const filePath = resolve(generatedImagesDirectory, imageUrl.slice(prefix.length))
  const pathRelativeToRoot = relative(generatedImagesDirectory, filePath)

  if (!pathRelativeToRoot || pathRelativeToRoot.startsWith('..') || pathRelativeToRoot.includes(`..${sep}`)) {
    throw createError({ statusCode: 404, statusMessage: 'Imagen no encontrada.' })
  }

  return filePath
}

export async function readStoredStudioImage(imageUrl: string) {
  if (imageUrl.startsWith('data:')) {
    const match = imageUrl.match(/^data:([^;,]+)?;base64,([A-Za-z0-9+/=]+)$/)

    if (!match?.[2]) {
      throw createError({ statusCode: 500, statusMessage: 'Los datos de imagen inline no son validos.' })
    }

    return Buffer.from(match[2], 'base64')
  }

  return readFile(resolveGeneratedImagePath(imageUrl))
}

export function getStoredImageExtension(imageUrl: string) {
  const extension = extname(imageUrl.split('?')[0] || '').toLowerCase()

  if (extension === '.jpg' || extension === '.jpeg') return '.jpg'
  if (extension === '.png') return '.png'

  throw createError({ statusCode: 500, statusMessage: 'El formato de imagen almacenado no es valido.' })
}

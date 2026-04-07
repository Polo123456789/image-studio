import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import { deflateRawSync } from 'node:zlib'

import { resolveAssetFilePath } from '../../../../utils/assets'
import { getStudioProjectBySlug } from '../../../../utils/studio-projects'

interface ZipEntry {
  fileName: string
  data: Buffer
}

function normalizeFilePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'concepto'
}

function sanitizeRatio(ratio: string) {
  return ratio.replace(/[^0-9:]+/g, '') || 'sin-ratio'
}

function inferImageExtension(imageUrl: string) {
  if (imageUrl.startsWith('data:image/jpeg')) return '.jpg'
  if (imageUrl.startsWith('data:image/png')) return '.png'
  if (imageUrl.startsWith('data:image/webp')) return '.webp'
  if (imageUrl.startsWith('data:image/gif')) return '.gif'

  const parsedExtension = extname(imageUrl.split('?')[0] || '').toLowerCase()

  return parsedExtension || '.png'
}

async function readVariantImage(imageUrl: string) {
  if (imageUrl.startsWith('data:')) {
    const match = imageUrl.match(/^data:([^;,]+)?;base64,(.+)$/)

    const base64Data = match?.[2]

    if (!base64Data) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Invalid inline image data'
      })
    }

    return Buffer.from(base64Data, 'base64')
  }

  if (!imageUrl.startsWith('/')) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Unsupported image URL format'
    })
  }

  return await readFile(resolveAssetFilePath(imageUrl))
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff

  for (const value of buffer) {
    crc ^= value

    for (let index = 0; index < 8; index += 1) {
      const mask = -(crc & 1)

      crc = (crc >>> 1) ^ (0xedb88320 & mask)
    }
  }

  return (crc ^ 0xffffffff) >>> 0
}

function getDosDateParts(date: Date) {
  const year = Math.max(date.getFullYear(), 1980)
  const dosTime = (date.getSeconds() >> 1) | (date.getMinutes() << 5) | (date.getHours() << 11)
  const dosDate = date.getDate() | ((date.getMonth() + 1) << 5) | ((year - 1980) << 9)

  return { dosDate, dosTime }
}

function createZip(entries: ZipEntry[]) {
  const localFileRecords: Buffer[] = []
  const centralDirectoryRecords: Buffer[] = []
  let offset = 0

  entries.forEach((entry) => {
    const fileNameBuffer = Buffer.from(entry.fileName, 'utf8')
    const compressedData = deflateRawSync(entry.data)
    const { dosDate, dosTime } = getDosDateParts(new Date())
    const checksum = crc32(entry.data)

    const localHeader = Buffer.alloc(30)

    localHeader.writeUInt32LE(0x04034b50, 0)
    localHeader.writeUInt16LE(20, 4)
    localHeader.writeUInt16LE(0, 6)
    localHeader.writeUInt16LE(8, 8)
    localHeader.writeUInt16LE(dosTime, 10)
    localHeader.writeUInt16LE(dosDate, 12)
    localHeader.writeUInt32LE(checksum, 14)
    localHeader.writeUInt32LE(compressedData.length, 18)
    localHeader.writeUInt32LE(entry.data.length, 22)
    localHeader.writeUInt16LE(fileNameBuffer.length, 26)
    localHeader.writeUInt16LE(0, 28)

    const localRecord = Buffer.concat([localHeader, fileNameBuffer, compressedData])

    localFileRecords.push(localRecord)

    const centralHeader = Buffer.alloc(46)

    centralHeader.writeUInt32LE(0x02014b50, 0)
    centralHeader.writeUInt16LE(20, 4)
    centralHeader.writeUInt16LE(20, 6)
    centralHeader.writeUInt16LE(0, 8)
    centralHeader.writeUInt16LE(8, 10)
    centralHeader.writeUInt16LE(dosTime, 12)
    centralHeader.writeUInt16LE(dosDate, 14)
    centralHeader.writeUInt32LE(checksum, 16)
    centralHeader.writeUInt32LE(compressedData.length, 20)
    centralHeader.writeUInt32LE(entry.data.length, 24)
    centralHeader.writeUInt16LE(fileNameBuffer.length, 28)
    centralHeader.writeUInt16LE(0, 30)
    centralHeader.writeUInt16LE(0, 32)
    centralHeader.writeUInt16LE(0, 34)
    centralHeader.writeUInt16LE(0, 36)
    centralHeader.writeUInt32LE(0, 38)
    centralHeader.writeUInt32LE(offset, 42)

    centralDirectoryRecords.push(Buffer.concat([centralHeader, fileNameBuffer]))
    offset += localRecord.length
  })

  const centralDirectory = Buffer.concat(centralDirectoryRecords)
  const localFiles = Buffer.concat(localFileRecords)
  const endRecord = Buffer.alloc(22)

  endRecord.writeUInt32LE(0x06054b50, 0)
  endRecord.writeUInt16LE(0, 4)
  endRecord.writeUInt16LE(0, 6)
  endRecord.writeUInt16LE(entries.length, 8)
  endRecord.writeUInt16LE(entries.length, 10)
  endRecord.writeUInt32LE(centralDirectory.length, 12)
  endRecord.writeUInt32LE(localFiles.length, 16)
  endRecord.writeUInt16LE(0, 20)

  return Buffer.concat([localFiles, centralDirectory, endRecord])
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')?.trim()

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing project slug'
    })
  }

  const project = getStudioProjectBySlug(slug)
  const usedFileNames = new Set<string>()
  const entries: ZipEntry[] = []

  for (const concept of project.concepts) {
    if (!concept.approvedAt) {
      continue
    }

    const activeFinalVariants = concept.formats.map((format) => {
      const variant = format.variants.find((item) => item.id === format.activeVariantId)

      return {
        format,
        variant
      }
    })

    if (!activeFinalVariants.length || activeFinalVariants.some(({ variant }) => !variant || variant.mode !== 'final' || !variant.imageUrl)) {
      continue
    }

    for (const { format, variant } of activeFinalVariants) {
      if (!variant) {
        continue
      }

      const extension = inferImageExtension(variant.imageUrl)
      const baseFileName = `${normalizeFilePart(concept.title)}-${sanitizeRatio(format.ratio)}`
      let fileName = `${baseFileName}${extension}`
      let duplicateIndex = 2

      while (usedFileNames.has(fileName)) {
        fileName = `${baseFileName}-${duplicateIndex}${extension}`
        duplicateIndex += 1
      }

      usedFileNames.add(fileName)
      entries.push({
        fileName,
        data: await readVariantImage(variant.imageUrl)
      })
    }
  }

  if (!entries.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No hay conceptos finales activos para exportar'
    })
  }

  const zipBuffer = createZip(entries)
  const exportName = `${normalizeFilePart(project.brief.projectName || project.slug)}-conceptos.zip`

  setHeader(event, 'Content-Type', 'application/zip')
  setHeader(event, 'Content-Disposition', `attachment; filename="${exportName}"`)
  setHeader(event, 'Content-Length', zipBuffer.length)
  setHeader(event, 'Cache-Control', 'no-store')

  return zipBuffer
})

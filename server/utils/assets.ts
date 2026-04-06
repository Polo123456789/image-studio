import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'

import { GoogleGenAI, Type } from '@google/genai'
import { asc, eq, inArray } from 'drizzle-orm'

import type { AssetRecord, AssetsResponse } from '../../shared/types/assets'
import { db } from '../db/client'
import { assets, brands } from '../db/schema'
import { getServerAppSettings } from './settings'

const assetsDirectory = resolve(process.cwd(), 'public/uploads/assets')
const supportedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const assetDescriptionModel = 'gemini-3-flash-preview'

function toIsoString(value: Date) {
  return value.toISOString()
}

function normalizeTags(value: string[] | null | undefined) {
  return Array.from(new Set((value || []).map((tag) => tag.trim()).filter(Boolean)))
}

function parseTags(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown

    if (!Array.isArray(parsed)) {
      return []
    }

    return normalizeTags(parsed.filter((item): item is string => typeof item === 'string'))
  }
  catch {
    return []
  }
}

function normalizeAssetRecord(record: {
  asset: typeof assets.$inferSelect
  brand: typeof brands.$inferSelect | null
}): AssetRecord {
  return {
    id: record.asset.id,
    name: record.asset.name,
    originalFileName: record.asset.originalFileName,
    fileUrl: record.asset.filePath,
    mimeType: record.asset.mimeType,
    fileSize: record.asset.fileSize,
    hash: record.asset.hash,
    description: record.asset.description,
    tags: parseTags(record.asset.tags),
    brandId: record.asset.brandId,
    brandName: record.brand?.name ?? null,
    createdAt: toIsoString(record.asset.createdAt),
    updatedAt: toIsoString(record.asset.updatedAt)
  }
}

function slugifyFilePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function getAssetExtension(fileName: string, mimeType: string) {
  const existingExtension = extname(fileName).toLowerCase()

  if (existingExtension) {
    return existingExtension
  }

  if (mimeType === 'image/png') return '.png'
  if (mimeType === 'image/webp') return '.webp'
  if (mimeType === 'image/gif') return '.gif'

  return '.jpg'
}

function buildStoredFileName(hash: string, originalFileName: string, mimeType: string) {
  return `${hash}${getAssetExtension(originalFileName, mimeType)}`
}

function ensureBrandExists(brandId: number | null) {
  if (brandId === null) {
    return null
  }

  const brand = db.query.brands.findFirst({
    where: eq(brands.id, brandId)
  }).sync()

  if (!brand) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Selected brand does not exist'
    })
  }

  return brand
}

function getAssetAiClient() {
  const settings = getServerAppSettings()
  const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY

  if (!apiKey) {
    return null
  }

  return new GoogleGenAI({ apiKey })
}

async function describeAssetWithAi(buffer: Buffer, mimeType: string, originalFileName: string) {
  const client = getAssetAiClient()

  if (!client || !supportedImageMimeTypes.has(mimeType)) {
    return {
      description: '',
      tags: [] as string[]
    }
  }

  try {
    const response = await client.models.generateContent({
      model: assetDescriptionModel,
      contents: {
        parts: [
          {
            text: [
              'Analiza este asset visual para una biblioteca interna de generacion de imagenes.',
              'Responde con una descripcion breve en espanol y entre 3 y 8 tags utiles para busqueda.',
              `Nombre de archivo original: ${originalFileName}.`
            ].join(' ')
          },
          {
            inlineData: {
              data: buffer.toString('base64'),
              mimeType
            }
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['description', 'tags']
        }
      }
    })

    const text = response.text?.trim()

    if (!text) {
      return { description: '', tags: [] as string[] }
    }

    const parsed = JSON.parse(text) as { description?: string, tags?: string[] }

    return {
      description: parsed.description?.trim() || '',
      tags: normalizeTags(parsed.tags)
    }
  }
  catch {
    return {
      description: '',
      tags: [] as string[]
    }
  }
}

function getAssetRecordById(id: number) {
  const record = db.select({
    asset: assets,
    brand: brands
  })
    .from(assets)
    .leftJoin(brands, eq(assets.brandId, brands.id))
    .where(eq(assets.id, id))
    .get()

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Asset not found'
    })
  }

  return normalizeAssetRecord(record)
}

export function getAssets(): AssetsResponse {
  const assetRows = db.select({
    asset: assets,
    brand: brands
  })
    .from(assets)
    .leftJoin(brands, eq(assets.brandId, brands.id))
    .orderBy(asc(assets.brandId), asc(assets.name), asc(assets.id))
    .all()

  const brandRows = db.select({
    id: brands.id,
    name: brands.name
  })
    .from(brands)
    .orderBy(asc(brands.name))
    .all()

  return {
    assets: assetRows.map(normalizeAssetRecord),
    brands: brandRows
  }
}

export function getAssetsByIds(ids: number[]) {
  if (!ids.length) {
    return []
  }

  const rows = db.select({
    asset: assets,
    brand: brands
  })
    .from(assets)
    .leftJoin(brands, eq(assets.brandId, brands.id))
    .where(inArray(assets.id, ids))
    .all()

  const assetById = new Map(rows.map((row) => [row.asset.id, normalizeAssetRecord(row)]))

  return ids
    .map((id) => assetById.get(id))
    .filter((asset): asset is AssetRecord => Boolean(asset))
}

export async function getAssetInlineDataByIds(ids: number[]) {
  const selectedAssets = getAssetsByIds(ids)

  return Promise.all(selectedAssets.map(async (asset) => {
    const absoluteFilePath = resolve(process.cwd(), 'public', asset.fileUrl.replace(/^\//, ''))
    const buffer = await readFile(absoluteFilePath)

    return {
      asset,
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: asset.mimeType
      }
    }
  }))
}

export async function createAssetFromUpload(formData: FormData) {
  const name = String(formData.get('name') || '').trim()
  const brandValue = String(formData.get('brandId') || '').trim()
  const brandId = brandValue ? Number(brandValue) : null
  const uploadedFile = formData.get('file')

  if (!(uploadedFile instanceof File)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Asset file is required'
    })
  }

  if (!uploadedFile.size) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Asset file is empty'
    })
  }

  ensureBrandExists(Number.isFinite(brandId) ? brandId : null)

  const buffer = Buffer.from(await uploadedFile.arrayBuffer())
  const hash = createHash('sha256').update(buffer).digest('hex')
  const existing = db.query.assets.findFirst({
    where: eq(assets.hash, hash)
  }).sync()

  if (existing) {
    return {
      asset: getAssetRecordById(existing.id),
      duplicate: true
    }
  }

  const mimeType = uploadedFile.type || 'application/octet-stream'
  const originalFileName = uploadedFile.name || 'asset'
  const displayName = name || slugifyFilePart(originalFileName.replace(extname(originalFileName), '')) || 'asset'
  const storedFileName = buildStoredFileName(hash, originalFileName, mimeType)
  const relativeFilePath = `/uploads/assets/${storedFileName}`
  const absoluteFilePath = resolve(assetsDirectory, storedFileName)
  const generatedMetadata = await describeAssetWithAi(buffer, mimeType, originalFileName)
  const now = new Date()

  await mkdir(assetsDirectory, { recursive: true })
  await writeFile(absoluteFilePath, buffer)

  const result = db.insert(assets)
    .values({
      name: displayName,
      originalFileName,
      filePath: relativeFilePath,
      mimeType,
      fileSize: uploadedFile.size,
      hash,
      description: generatedMetadata.description,
      tags: JSON.stringify(generatedMetadata.tags),
      brandId: Number.isFinite(brandId) ? brandId : null,
      createdAt: now,
      updatedAt: now
    })
    .returning({ id: assets.id })
    .get()

  return {
    asset: getAssetRecordById(result.id),
    duplicate: false
  }
}

import { and, asc, eq, inArray, isNull, ne } from 'drizzle-orm'

import type { StyleGuidePayload, StyleGuideRecord, StyleGuidesResponse } from '../../shared/types/style-guides'
import { db } from '../db/client'
import { brands, styleGuides } from '../db/schema'

function toIsoString(value: Date) {
  return value.toISOString()
}

function normalizeStyleGuideRecord(record: {
  guide: typeof styleGuides.$inferSelect
  brand: typeof brands.$inferSelect | null
}): StyleGuideRecord {
  return {
    id: record.guide.id,
    name: record.guide.name,
    content: record.guide.content,
    brandId: record.guide.brandId,
    brandName: record.brand?.name ?? null,
    createdAt: toIsoString(record.guide.createdAt),
    updatedAt: toIsoString(record.guide.updatedAt)
  }
}

function normalizePayload(payload: StyleGuidePayload): StyleGuidePayload {
  return {
    name: payload.name.trim(),
    content: payload.content.trim(),
    brandId: payload.brandId ?? null
  }
}

function validatePayload(payload: StyleGuidePayload) {
  if (!payload.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Style guide name is required'
    })
  }

  if (!payload.content) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Style guide content is required'
    })
  }

  if (payload.brandId !== null) {
    const brand = db.query.brands.findFirst({
      where: eq(brands.id, payload.brandId)
    }).sync()

    if (!brand) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Selected brand does not exist'
      })
    }
  }
}

function ensureUniqueName(name: string, brandId: number | null, excludedId?: number) {
  const existing = db.query.styleGuides.findFirst({
    where: typeof excludedId === 'number'
      ? and(
        eq(styleGuides.name, name),
        brandId === null ? isNull(styleGuides.brandId) : eq(styleGuides.brandId, brandId),
        ne(styleGuides.id, excludedId)
      )
      : and(
        eq(styleGuides.name, name),
        brandId === null ? isNull(styleGuides.brandId) : eq(styleGuides.brandId, brandId)
      )
  }).sync()

  if (existing && existing.id !== excludedId) {
    throw createError({
      statusCode: 409,
      statusMessage: 'A style guide with that name already exists in this scope'
    })
  }
}

function getGuideRecordById(id: number) {
  const record = db.select({
    guide: styleGuides,
    brand: brands
  })
    .from(styleGuides)
    .leftJoin(brands, eq(styleGuides.brandId, brands.id))
    .where(eq(styleGuides.id, id))
    .get()

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Style guide not found'
    })
  }

  return normalizeStyleGuideRecord(record)
}

export function getStyleGuides(): StyleGuidesResponse {
  const guideRows = db.select({
    guide: styleGuides,
    brand: brands
  })
    .from(styleGuides)
    .leftJoin(brands, eq(styleGuides.brandId, brands.id))
    .orderBy(asc(styleGuides.brandId), asc(styleGuides.name))
    .all()

  const brandRows = db.select({
    id: brands.id,
    name: brands.name
  })
    .from(brands)
    .orderBy(asc(brands.name))
    .all()

  return {
    guides: guideRows.map(normalizeStyleGuideRecord),
    brands: brandRows
  }
}

export function getStyleGuidesByIds(ids: number[]): StyleGuideRecord[] {
  if (!ids.length) {
    return []
  }

  const rows = db.select({
    guide: styleGuides,
    brand: brands
  })
    .from(styleGuides)
    .leftJoin(brands, eq(styleGuides.brandId, brands.id))
    .where(inArray(styleGuides.id, ids))
    .all()

  const guideById = new Map(rows.map((row) => [row.guide.id, normalizeStyleGuideRecord(row)]))

  return ids
    .map((id) => guideById.get(id))
    .filter((guide): guide is StyleGuideRecord => Boolean(guide))
}

export function createStyleGuide(payload: StyleGuidePayload): StyleGuideRecord {
  const normalizedPayload = normalizePayload(payload)

  validatePayload(normalizedPayload)
  ensureUniqueName(normalizedPayload.name, normalizedPayload.brandId)

  const now = new Date()
  const result = db.insert(styleGuides)
    .values({
      name: normalizedPayload.name,
      content: normalizedPayload.content,
      brandId: normalizedPayload.brandId,
      createdAt: now,
      updatedAt: now
    })
    .returning({ id: styleGuides.id })
    .get()

  return getGuideRecordById(result.id)
}

export function updateStyleGuide(id: number, payload: StyleGuidePayload): StyleGuideRecord {
  const existing = db.query.styleGuides.findFirst({
    where: eq(styleGuides.id, id)
  }).sync()

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Style guide not found'
    })
  }

  const normalizedPayload = normalizePayload(payload)

  validatePayload(normalizedPayload)
  ensureUniqueName(normalizedPayload.name, normalizedPayload.brandId, id)

  db.update(styleGuides)
    .set({
      name: normalizedPayload.name,
      content: normalizedPayload.content,
      brandId: normalizedPayload.brandId,
      updatedAt: new Date()
    })
    .where(eq(styleGuides.id, id))
    .run()

  return getGuideRecordById(id)
}

export function deleteStyleGuide(id: number) {
  const existing = db.query.styleGuides.findFirst({
    where: eq(styleGuides.id, id)
  }).sync()

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Style guide not found'
    })
  }

  db.delete(styleGuides)
    .where(eq(styleGuides.id, id))
    .run()
}

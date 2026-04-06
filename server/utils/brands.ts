import { asc, eq, sql } from 'drizzle-orm'

import type { BrandOption, BrandPayload, BrandRecord, BrandsResponse } from '../../shared/types/brands'
import { db } from '../db/client'
import { assets, brands, styleGuides } from '../db/schema'

function toIsoString(value: Date) {
  return value.toISOString()
}

function normalizePayload(payload: BrandPayload): BrandPayload {
  return {
    name: payload.name.trim(),
    description: payload.description.trim(),
    defaultStyleGuideId: payload.defaultStyleGuideId ?? null
  }
}

function validatePayload(payload: BrandPayload, existingBrandId?: number) {
  if (!payload.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Brand name is required'
    })
  }

  if (payload.defaultStyleGuideId === null) {
    return
  }

  const guide = db.query.styleGuides.findFirst({
    where: eq(styleGuides.id, payload.defaultStyleGuideId)
  }).sync()

  if (!guide) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Selected default style guide does not exist'
    })
  }

  if (typeof existingBrandId === 'number' && guide.brandId !== null && guide.brandId !== existingBrandId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Default style guide must be global or belong to this brand'
    })
  }
}

function ensureUniqueName(name: string, excludedId?: number) {
  const existing = db.query.brands.findFirst({
    where: excludedId ? sql`${brands.name} = ${name} and ${brands.id} != ${excludedId}` : eq(brands.name, name)
  }).sync()

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'A brand with that name already exists'
    })
  }
}

function mapBrandOption(row: {
  brand: typeof brands.$inferSelect
  defaultGuideName: string | null
}): BrandOption {
  return {
    id: row.brand.id,
    name: row.brand.name,
    description: row.brand.description,
    defaultStyleGuideId: row.brand.defaultStyleGuideId,
    defaultStyleGuideName: row.defaultGuideName
  }
}

function mapBrandRecord(row: {
  brand: typeof brands.$inferSelect
  defaultGuideName: string | null
  assetCount: number
  styleGuideCount: number
}): BrandRecord {
  return {
    ...mapBrandOption(row),
    assetCount: row.assetCount,
    styleGuideCount: row.styleGuideCount,
    createdAt: toIsoString(row.brand.createdAt),
    updatedAt: toIsoString(row.brand.updatedAt)
  }
}

function getBrandRecordById(id: number): BrandRecord {
  const row = db.select({
    brand: brands,
    defaultGuideName: styleGuides.name
  })
    .from(brands)
    .leftJoin(styleGuides, eq(brands.defaultStyleGuideId, styleGuides.id))
    .where(eq(brands.id, id))
    .get()

  if (!row) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Brand not found'
    })
  }

  const assetCountRow = db.select({ count: sql<number>`count(*)` })
    .from(assets)
    .where(eq(assets.brandId, id))
    .get()

  const styleGuideCountRow = db.select({ count: sql<number>`count(*)` })
    .from(styleGuides)
    .where(eq(styleGuides.brandId, id))
    .get()

  return mapBrandRecord({
    ...row,
    assetCount: assetCountRow?.count ?? 0,
    styleGuideCount: styleGuideCountRow?.count ?? 0
  })
}

export function getBrandOptions(): BrandOption[] {
  const rows = db.select({
    brand: brands,
    defaultGuideName: styleGuides.name
  })
    .from(brands)
    .leftJoin(styleGuides, eq(brands.defaultStyleGuideId, styleGuides.id))
    .orderBy(asc(brands.name))
    .all()

  return rows.map(mapBrandOption)
}

export function getBrands(): BrandsResponse {
  const rows = db.select({
    brand: brands,
    defaultGuideName: styleGuides.name,
    assetCount: sql<number>`(
      select count(*) from ${assets}
      where ${assets.brandId} = ${brands.id}
    )`,
    styleGuideCount: sql<number>`(
      select count(*) from ${styleGuides}
      where ${styleGuides.brandId} = ${brands.id}
    )`
  })
    .from(brands)
    .leftJoin(styleGuides, eq(brands.defaultStyleGuideId, styleGuides.id))
    .orderBy(asc(brands.name))
    .all()

  return {
    brands: rows.map(mapBrandRecord)
  }
}

export function createBrand(payload: BrandPayload): BrandRecord {
  const normalizedPayload = normalizePayload(payload)

  validatePayload(normalizedPayload)
  ensureUniqueName(normalizedPayload.name)

  if (normalizedPayload.defaultStyleGuideId !== null) {
    const defaultGuide = db.query.styleGuides.findFirst({
      where: eq(styleGuides.id, normalizedPayload.defaultStyleGuideId)
    }).sync()

    if (defaultGuide?.brandId !== null) {
      throw createError({
        statusCode: 400,
        statusMessage: 'New brands can only start with a global default style guide'
      })
    }
  }

  const now = new Date()
  const result = db.insert(brands)
    .values({
      name: normalizedPayload.name,
      description: normalizedPayload.description || null,
      defaultStyleGuideId: normalizedPayload.defaultStyleGuideId,
      createdAt: now,
      updatedAt: now
    })
    .returning({ id: brands.id })
    .get()

  return getBrandRecordById(result.id)
}

export function updateBrand(id: number, payload: BrandPayload): BrandRecord {
  const existing = db.query.brands.findFirst({
    where: eq(brands.id, id)
  }).sync()

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Brand not found'
    })
  }

  const normalizedPayload = normalizePayload(payload)

  validatePayload(normalizedPayload, id)
  ensureUniqueName(normalizedPayload.name, id)

  db.update(brands)
    .set({
      name: normalizedPayload.name,
      description: normalizedPayload.description || null,
      defaultStyleGuideId: normalizedPayload.defaultStyleGuideId,
      updatedAt: new Date()
    })
    .where(eq(brands.id, id))
    .run()

  return getBrandRecordById(id)
}

export function deleteBrand(id: number) {
  const existing = db.query.brands.findFirst({
    where: eq(brands.id, id)
  }).sync()

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Brand not found'
    })
  }

  db.transaction((tx) => {
    tx.update(styleGuides)
      .set({
        brandId: null,
        updatedAt: new Date()
      })
      .where(eq(styleGuides.brandId, id))
      .run()

    tx.update(assets)
      .set({
        brandId: null,
        updatedAt: new Date()
      })
      .where(eq(assets.brandId, id))
      .run()

    tx.delete(brands)
      .where(eq(brands.id, id))
      .run()
  })
}

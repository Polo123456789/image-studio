import { and, asc, desc, eq, isNull, or, sql, type SQL } from 'drizzle-orm'

import type {
  LibraryCollectionItem,
  LibraryFolderItem,
  LibraryImageItem,
  LibraryImageVersion,
  LibraryResponse,
  StudioVariantMode
} from '../../shared/types/studio'
import { db } from '../db/client'
import { studioConceptFormats, studioConcepts, studioProjects, studioVariants } from '../db/schema'
import { requireStudioVariantMode } from './studio/variants'

export interface LibraryQuery {
  page?: number
  pageSize?: number
  folder?: string
  collection?: string
  query?: string
  sort?: 'recent' | 'versions' | 'project'
}

const versionCount = sql<number>`(
  select count(*) from studio_variants as version
  where version.format_id = ${studioConceptFormats.id}
)`

const latestVariantCreatedAt = sql<number>`(
  select max(latest.created_at) from studio_variants as latest
  where latest.format_id = ${studioConceptFormats.id}
)`
const hasFinalVariant = sql<number>`exists (
  select 1 from studio_variants as final_variant
  where final_variant.format_id = ${studioConceptFormats.id} and final_variant.mode = 'final'
)`
const hasPreviewVariant = sql<number>`exists (
  select 1 from studio_variants as preview_variant
  where preview_variant.format_id = ${studioConceptFormats.id} and preview_variant.mode = 'preview'
)`

const baseSelection = {
  formatId: studioConceptFormats.id,
  ratio: studioConceptFormats.ratio,
  activeVariantKey: studioConceptFormats.activeVariantKey,
  projectSlug: studioProjects.slug,
  projectName: studioProjects.projectName,
  projectUpdatedAt: studioProjects.updatedAt,
  conceptKey: studioConcepts.conceptKey,
  conceptTitle: studioConcepts.title,
  conceptSubtitle: studioConcepts.subtitle,
  imageUrl: studioVariants.imageUrl,
  thumbnailUrl: studioVariants.thumbnailUrl,
  variantKey: studioVariants.variantKey,
  variantLabel: studioVariants.label,
  variantMode: studioVariants.mode,
  variantPrompt: studioVariants.prompt,
  variantCreatedAt: studioVariants.createdAt,
  versionCount,
  latestVariantCreatedAt,
  hasFinalVariant,
  hasPreviewVariant
}

function baseQuery() {
  return db.select(baseSelection)
    .from(studioConceptFormats)
    .innerJoin(studioConcepts, eq(studioConcepts.id, studioConceptFormats.conceptId))
    .innerJoin(studioProjects, eq(studioProjects.id, studioConcepts.projectId))
    .innerJoin(studioVariants, and(
      eq(studioVariants.formatId, studioConceptFormats.id),
      eq(studioVariants.variantKey, studioConceptFormats.activeVariantKey)
    ))
}

type LibraryRow = ReturnType<ReturnType<typeof baseQuery>['all']>[number]

function collectionConditions(collection?: string): SQL[] {
  if (!collection) return []
  const hasMode = (mode: StudioVariantMode) => sql`exists (
    select 1 from studio_variants as collection_variant
    where collection_variant.format_id = ${studioConceptFormats.id}
      and collection_variant.mode = ${mode}
  )`
  if (collection === 'artes') return [hasMode('final')]
  if (collection === 'previews-legado') return [hasMode('preview')]
  if (collection.startsWith('ratio:')) return [eq(studioConceptFormats.ratio, collection.slice(6))]
  if (collection.startsWith('entrega:')) {
    return [hasMode('final'), eq(studioConceptFormats.ratio, collection.slice(8))]
  }
  if (collection.startsWith('legado:')) {
    return [hasMode('preview'), eq(studioConceptFormats.ratio, collection.slice(7))]
  }
  return [sql`0 = 1`]
}

function buildConditions(input: LibraryQuery) {
  const conditions: SQL[] = [isNull(studioConcepts.discardedAt)]
  if (input.folder && input.folder !== 'all') conditions.push(eq(studioProjects.slug, input.folder))
  conditions.push(...collectionConditions(input.collection))

  const search = input.query?.trim()
  if (search) {
    const pattern = `%${search.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`
    conditions.push(or(
      sql`${studioProjects.projectName} like ${pattern} escape '\\'`,
      sql`${studioConcepts.title} like ${pattern} escape '\\'`,
      sql`${studioConcepts.subtitle} like ${pattern} escape '\\'`,
      sql`exists (
        select 1 from studio_variants as search_variant
        where search_variant.format_id = ${studioConceptFormats.id}
          and search_variant.prompt like ${pattern} escape '\\'
      )`
    )!)
  }
  return conditions
}

function mapCurrentVersion(row: LibraryRow): LibraryImageVersion {
  return {
    id: row.variantKey,
    label: row.variantLabel,
    mode: requireStudioVariantMode(row.variantMode),
    prompt: row.variantPrompt,
    imageUrl: row.imageUrl,
    thumbnailUrl: row.thumbnailUrl,
    createdAt: row.variantCreatedAt.toISOString()
  }
}

function mapSummary(row: LibraryRow): LibraryImageItem {
  const currentVersion = mapCurrentVersion(row)
  const collectionKeys = [`ratio:${row.ratio}`]
  if (row.hasFinalVariant) collectionKeys.push('artes', `entrega:${row.ratio}`)
  if (row.hasPreviewVariant) collectionKeys.push('previews-legado', `legado:${row.ratio}`)
  return {
    id: String(row.formatId),
    name: `${row.conceptTitle} ${row.ratio}`,
    projectSlug: row.projectSlug,
    projectName: row.projectName,
    conceptId: row.conceptKey,
    conceptTitle: row.conceptTitle,
    conceptSubtitle: row.conceptSubtitle,
    ratio: row.ratio,
    currentMode: currentVersion.mode,
    createdAt: currentVersion.createdAt,
    updatedAt: currentVersion.createdAt,
    currentVersionId: currentVersion.id,
    versions: [currentVersion],
    collectionKeys
  }
}

function buildCatalog() {
  const imageCount = sql<number>`count(distinct case when ${studioVariants.id} is not null then ${studioConceptFormats.id} end)`
  const coverImageUrl = sql<string | null>`(
    select coalesce(cover_variant.thumbnail_url, cover_variant.image_url)
    from studio_variants as cover_variant
    inner join studio_concept_formats as cover_format on cover_format.id = cover_variant.format_id
    inner join studio_concepts as cover_concept on cover_concept.id = cover_format.concept_id
    where cover_concept.project_id = ${studioProjects.id}
      and cover_concept.discarded_at is null
    order by cover_variant.created_at desc, cover_variant.id desc
    limit 1
  )`
  const folderRows = db.select({
    id: studioProjects.slug,
    name: studioProjects.projectName,
    projectSlug: studioProjects.slug,
    imageCount,
    updatedAt: studioProjects.updatedAt,
    coverImageUrl
  })
    .from(studioProjects)
    .leftJoin(studioConcepts, and(eq(studioConcepts.projectId, studioProjects.id), isNull(studioConcepts.discardedAt)))
    .leftJoin(studioConceptFormats, eq(studioConceptFormats.conceptId, studioConcepts.id))
    .leftJoin(studioVariants, eq(studioVariants.formatId, studioConceptFormats.id))
    .groupBy(studioProjects.id)
    .orderBy(desc(studioProjects.updatedAt), desc(studioProjects.id))
    .all()

  const collectionMap = new Map<string, LibraryCollectionItem>()
  const collectionRows = db.select({
    mode: studioVariants.mode,
    ratio: studioConceptFormats.ratio,
    imageCount: sql<number>`count(distinct ${studioConceptFormats.id})`
  })
    .from(studioVariants)
    .innerJoin(studioConceptFormats, eq(studioConceptFormats.id, studioVariants.formatId))
    .innerJoin(studioConcepts, eq(studioConcepts.id, studioConceptFormats.conceptId))
    .where(isNull(studioConcepts.discardedAt))
    .groupBy(studioVariants.mode, studioConceptFormats.ratio)
    .all()

  for (const row of collectionRows) {
    const mode = requireStudioVariantMode(row.mode)
    const keys = mode === 'final'
      ? ['artes', `entrega:${row.ratio}`]
      : ['previews-legado', `legado:${row.ratio}`]
    for (const key of keys) {
      const collection = collectionMap.get(key)
      const count = Number(row.imageCount)
      if (collection) collection.imageCount += count
      else collectionMap.set(key, { id: key, name: key, imageCount: count })
    }
  }

  const ratioRows = db.select({
    ratio: studioConceptFormats.ratio,
    imageCount: sql<number>`count(distinct ${studioConceptFormats.id})`
  })
    .from(studioVariants)
    .innerJoin(studioConceptFormats, eq(studioConceptFormats.id, studioVariants.formatId))
    .innerJoin(studioConcepts, eq(studioConcepts.id, studioConceptFormats.conceptId))
    .where(isNull(studioConcepts.discardedAt))
    .groupBy(studioConceptFormats.ratio)
    .all()
  for (const row of ratioRows) {
    const key = `ratio:${row.ratio}`
    collectionMap.set(key, { id: key, name: key, imageCount: Number(row.imageCount) })
  }

  const totalVersionsRow = db.select({ count: sql<number>`count(*)` })
    .from(studioVariants)
    .innerJoin(studioConceptFormats, eq(studioConceptFormats.id, studioVariants.formatId))
    .innerJoin(studioConcepts, eq(studioConcepts.id, studioConceptFormats.conceptId))
    .where(isNull(studioConcepts.discardedAt))
    .get()

  return {
    folders: folderRows.map((row): LibraryFolderItem => ({
      ...row,
      imageCount: Number(row.imageCount),
      updatedAt: row.updatedAt.toISOString()
    })),
    collections: Array.from(collectionMap.values())
      .sort((left, right) => right.imageCount - left.imageCount || left.name.localeCompare(right.name)),
    totalVersions: Number(totalVersionsRow?.count || 0)
  }
}

export function getLibraryData(input: LibraryQuery = {}): LibraryResponse {
  const pageSize = Math.max(1, Math.min(100, Math.floor(input.pageSize || 40)))
  const conditions = buildConditions(input)
  const totalRow = db.select({ count: sql<number>`count(*)` })
    .from(studioConceptFormats)
    .innerJoin(studioConcepts, eq(studioConcepts.id, studioConceptFormats.conceptId))
    .innerJoin(studioProjects, eq(studioProjects.id, studioConcepts.projectId))
    .innerJoin(studioVariants, and(
      eq(studioVariants.formatId, studioConceptFormats.id),
      eq(studioVariants.variantKey, studioConceptFormats.activeVariantKey)
    ))
    .where(and(...conditions))
    .get()
  const totalImages = Number(totalRow?.count || 0)
  const totalPages = Math.max(1, Math.ceil(totalImages / pageSize))
  const page = Math.min(totalPages, Math.max(1, Math.floor(input.page || 1)))
  const query = baseQuery().where(and(...conditions))

  const order = input.sort === 'versions'
    ? [desc(versionCount), desc(latestVariantCreatedAt), desc(studioVariants.id)]
    : input.sort === 'project'
      ? [asc(studioProjects.projectName), desc(latestVariantCreatedAt), desc(studioVariants.id)]
      : [desc(latestVariantCreatedAt), desc(studioVariants.id)]
  const rows = query.orderBy(...order).limit(pageSize).offset((page - 1) * pageSize).all()
  const catalog = buildCatalog()

  return {
    ...catalog,
    images: rows.map(mapSummary),
    pagination: {
      page,
      pageSize,
      totalImages,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages
    }
  }
}

export function getLibraryImageDetail(formatId: number): LibraryImageItem {
  const summary = baseQuery()
    .where(and(eq(studioConceptFormats.id, formatId), isNull(studioConcepts.discardedAt)))
    .get()

  if (!summary) throw createError({ statusCode: 404, statusMessage: 'Imagen no encontrada.' })

  const versions = db.select()
    .from(studioVariants)
    .where(eq(studioVariants.formatId, formatId))
    .orderBy(desc(studioVariants.createdAt), desc(studioVariants.id))
    .all()
    .map((variant): LibraryImageVersion => ({
      id: variant.variantKey,
      label: variant.label,
      mode: requireStudioVariantMode(variant.mode),
      prompt: variant.prompt,
      imageUrl: variant.imageUrl,
      thumbnailUrl: variant.thumbnailUrl,
      createdAt: variant.createdAt.toISOString()
    }))
  const image = mapSummary(summary)
  image.versions = versions
  image.createdAt = versions.at(-1)?.createdAt || image.createdAt
  image.updatedAt = versions[0]?.createdAt || image.updatedAt
  return image
}

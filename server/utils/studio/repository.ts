import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm'

import type {
  StudioConcept,
  StudioProject,
  StudioProjectListItem,
  StudioProjectListPagination,
  StudioProjectListResponse,
  StudioVariantMode
} from '../../../shared/types/studio'
import { db } from '../../db/client'
import {
  studioConceptFormats,
  studioConcepts,
  studioProjects,
  studioVariants
} from '../../db/schema'
import { normalizeStudioBriefPayload, serializeStudioBrief, validateStudioConcepts } from './briefs'
import { mapConceptRows, mapProject, mapProjectListItem } from './mappers'
import {
  appendProjectConcepts,
  persistDiscardedConcept,
  persistFinalVariants,
  persistFormatPrompt,
  persistGeneratedVariant,
  persistSelectedVariant,
  replaceProjectConcepts
} from './persistence'
import type {
  StudioConceptFormatRow,
  StudioConceptRow,
  StudioProjectRow,
  StudioVariantRow
} from './types'

function normalizeSlugPart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function createProjectSlug(projectName: string) {
  return normalizeSlugPart(projectName) || 'proyecto'
}

function ensureProject(project?: StudioProjectRow) {
  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Studio project not found'
    })
  }

  return project
}

function ensureConcept(concept?: StudioConcept) {
  if (!concept) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Concept not found'
    })
  }

  return concept
}

function ensureConceptRow(concept?: StudioConceptRow) {
  if (!concept) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Concept not found'
    })
  }

  return concept
}

function ensureFormatRow(format?: StudioConceptFormatRow) {
  if (!format) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Concept format not found'
    })
  }

  return format
}

function ensureVariantRow(variant?: StudioVariantRow) {
  if (!variant) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Variant not found for selected format'
    })
  }

  return variant
}

function getStudioProjectRowBySlug(slug: string) {
  return ensureProject(db.query.studioProjects.findFirst({
    where: eq(studioProjects.slug, slug)
  }).sync())
}

async function generateUniqueSlug(projectName: string) {
  const baseSlug = createProjectSlug(projectName)

  for (let index = 0; index < 1000; index += 1) {
    const candidate = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`
    const existing = db.query.studioProjects.findFirst({
      where: eq(studioProjects.slug, candidate)
    }).sync()

    if (!existing) {
      return candidate
    }
  }

  throw createError({
    statusCode: 500,
    statusMessage: 'Could not generate a unique studio project slug'
  })
}

function getStudioConceptRow(projectId: number, conceptId: string) {
  return ensureConceptRow(db.query.studioConcepts.findFirst({
    where: and(
      eq(studioConcepts.projectId, projectId),
      eq(studioConcepts.conceptKey, conceptId),
      isNull(studioConcepts.discardedAt)
    )
  }).sync())
}

function getStudioConceptFormatRow(conceptRowId: number, ratio: string) {
  return ensureFormatRow(db.query.studioConceptFormats.findFirst({
    where: and(
      eq(studioConceptFormats.conceptId, conceptRowId),
      eq(studioConceptFormats.ratio, ratio)
    )
  }).sync())
}

function getStudioVariantRow(formatRowId: number, variantId: string) {
  return ensureVariantRow(db.query.studioVariants.findFirst({
    where: and(
      eq(studioVariants.formatId, formatRowId),
      eq(studioVariants.variantKey, variantId)
    )
  }).sync())
}

function listProjectConceptRows(projectId: number) {
  return db.select()
    .from(studioConcepts)
    .where(and(eq(studioConcepts.projectId, projectId), isNull(studioConcepts.discardedAt)))
    .orderBy(asc(studioConcepts.position), asc(studioConcepts.id))
    .all()
}

function listConceptFormatRows(conceptIds: number[]) {
  if (!conceptIds.length) {
    return []
  }

  return db.select()
    .from(studioConceptFormats)
    .where(inArray(studioConceptFormats.conceptId, conceptIds))
    .orderBy(asc(studioConceptFormats.id))
    .all()
}

function listFormatVariantRows(formatIds: number[]) {
  if (!formatIds.length) {
    return []
  }

  return db.select()
    .from(studioVariants)
    .where(inArray(studioVariants.formatId, formatIds))
    .orderBy(desc(studioVariants.createdAt), desc(studioVariants.id))
    .all()
}

function listMappedProjectConcepts(projectId: number): StudioConcept[] {
  const conceptRows = listProjectConceptRows(projectId)

  if (!conceptRows.length) {
    return []
  }

  const formatRows = listConceptFormatRows(conceptRows.map((concept) => concept.id))
  const variantRows = listFormatVariantRows(formatRows.map((format) => format.id))

  return mapConceptRows(conceptRows, formatRows, variantRows)
}

function listProjectSummaries(projects: StudioProjectRow[], includeThumbnail: boolean): StudioProjectListItem[] {
  const projectIds = projects.map((project) => project.id)

  if (!projectIds.length) {
    return []
  }

  const conceptRows = db.select({ id: studioConcepts.id, projectId: studioConcepts.projectId })
    .from(studioConcepts)
    .where(and(inArray(studioConcepts.projectId, projectIds), isNull(studioConcepts.discardedAt)))
    .all()
  const conceptIds = conceptRows.map((concept) => concept.id)
  const formatRows = listConceptFormatRows(conceptIds)
  const formatIdsByProjectId = new Map<number, number[]>()
  const projectIdByConceptId = new Map(conceptRows.map((concept) => [concept.id, concept.projectId]))

  formatRows.forEach((format) => {
    const projectId = projectIdByConceptId.get(format.conceptId)

    if (!projectId) {
      return
    }

    const formatIds = formatIdsByProjectId.get(projectId) || []
    formatIds.push(format.id)
    formatIdsByProjectId.set(projectId, formatIds)
  })

  const allFormatIds = formatRows.map((format) => format.id)
  const variantRows = allFormatIds.length
    ? db.select({
        formatId: studioVariants.formatId,
        imageUrl: studioVariants.imageUrl,
        mode: studioVariants.mode,
        createdAt: studioVariants.createdAt,
        id: studioVariants.id
      })
        .from(studioVariants)
        .where(inArray(studioVariants.formatId, allFormatIds))
        .orderBy(desc(studioVariants.createdAt), desc(studioVariants.id))
        .all()
    : []
  const variantsByFormatId = new Map<number, typeof variantRows>()

  variantRows.forEach((variant) => {
    const variants = variantsByFormatId.get(variant.formatId) || []
    variants.push(variant)
    variantsByFormatId.set(variant.formatId, variants)
  })

  return projects.map((project) => {
    const conceptCount = conceptRows.filter((concept) => concept.projectId === project.id).length
    const formatIds = formatIdsByProjectId.get(project.id) || []
    const variants = formatIds.flatMap((formatId) => variantsByFormatId.get(formatId) || [])
    const finalVariant = variants.find((variant) => variant.mode === 'final')
    const fallbackVariant = includeThumbnail && !finalVariant ? variants[0] : null

    return mapProjectListItem(project, {
      conceptCount,
      finalVariantUrl: finalVariant?.imageUrl ?? null,
      fallbackVariantUrl: fallbackVariant?.imageUrl ?? null,
      includeThumbnail
    })
  })
}

export function getStudioProjectBySlug(slug: string): StudioProject {
  const project = getStudioProjectRowBySlug(slug)

  return mapProject(project, listMappedProjectConcepts(project.id))
}

export function listStudioProjects(): StudioProjectListItem[] {
  const projects = db.select()
    .from(studioProjects)
    .orderBy(desc(studioProjects.updatedAt), desc(studioProjects.id))
    .all()

  return listProjectSummaries(projects, false)
}

export function listPaginatedStudioProjects(page: number, pageSize = 6): StudioProjectListResponse {
  const totalRow = db.select({ count: sql<number>`count(*)` })
    .from(studioProjects)
    .get()
  const totalProjects = Number(totalRow?.count ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalProjects / pageSize))
  const safePage = Number.isInteger(page) && page > 0
    ? Math.min(page, totalPages)
    : 1
  const offset = (safePage - 1) * pageSize
  const projects = db.select()
    .from(studioProjects)
    .orderBy(desc(studioProjects.updatedAt), desc(studioProjects.id))
    .limit(pageSize)
    .offset(offset)
    .all()

  const pagination: StudioProjectListPagination = {
    page: safePage,
    pageSize,
    totalProjects,
    totalPages,
    hasPreviousPage: safePage > 1,
    hasNextPage: safePage < totalPages
  }

  return {
    projects: listProjectSummaries(projects, true),
    pagination
  }
}

export async function createStudioProject(brief: unknown): Promise<StudioProject> {
  const normalizedBrief = normalizeStudioBriefPayload(brief)
  const now = new Date()
  const slug = await generateUniqueSlug(normalizedBrief.projectName)

  db.insert(studioProjects)
    .values({
      slug,
      projectName: normalizedBrief.projectName,
      brief: serializeStudioBrief(normalizedBrief),
      createdAt: now,
      updatedAt: now
    })
    .run()

  return getStudioProjectBySlug(slug)
}

export function updateStudioProjectBrief(slug: string, brief: unknown): StudioProject {
  const project = getStudioProjectRowBySlug(slug)
  const normalizedBrief = normalizeStudioBriefPayload(brief)

  db.update(studioProjects)
    .set({
      projectName: normalizedBrief.projectName,
      brief: serializeStudioBrief(normalizedBrief),
      updatedAt: new Date()
    })
    .where(eq(studioProjects.id, project.id))
    .run()

  return getStudioProjectBySlug(slug)
}

export function saveStudioConcepts(slug: string, concepts: StudioConcept[]): StudioProject {
  const normalizedConcepts = validateStudioConcepts(concepts)
  const project = getStudioProjectRowBySlug(slug)

  replaceProjectConcepts(project.id, normalizedConcepts)

  return getStudioProjectBySlug(slug)
}

export function appendStudioConcepts(slug: string, concepts: StudioConcept[]): StudioConcept[] {
  const normalizedConcepts = validateStudioConcepts(concepts)

  if (!normalizedConcepts.length) {
    return []
  }

  const project = getStudioProjectRowBySlug(slug)

  appendProjectConcepts(project.id, normalizedConcepts)

  return normalizedConcepts.map((concept) => getStudioConceptById(slug, concept.id))
}

export function updateStudioConceptSelectedVariant(
  slug: string,
  conceptId: string,
  ratio: string,
  activeVariantId: string
): void {
  const project = getStudioProjectRowBySlug(slug)
  const conceptRow = getStudioConceptRow(project.id, conceptId)
  const formatRow = getStudioConceptFormatRow(conceptRow.id, ratio)

  getStudioVariantRow(formatRow.id, activeVariantId)
  persistSelectedVariant(project.id, formatRow.id, activeVariantId)
}

export function updateStudioConceptFormatPrompt(slug: string, conceptId: string, ratio: string, promptDraft: string): StudioConcept {
  const project = getStudioProjectRowBySlug(slug)
  const conceptRow = getStudioConceptRow(project.id, conceptId)
  const formatRow = getStudioConceptFormatRow(conceptRow.id, ratio)

  persistFormatPrompt(project.id, conceptRow.id, formatRow.id, promptDraft)

  return getStudioConceptById(slug, conceptId)
}

export function discardStudioConcept(slug: string, conceptId: string): StudioConcept[] {
  const project = getStudioProjectRowBySlug(slug)
  const conceptRow = getStudioConceptRow(project.id, conceptId)

  persistDiscardedConcept(project.id, conceptRow.id)

  return getStudioProjectBySlug(slug).concepts
}

export function addStudioConceptVariant(
  slug: string,
  conceptId: string,
  ratio: string,
  mode: StudioVariantMode,
  prompt: string,
  imageUrl: string,
  resolution?: string
): StudioConcept {
  const project = getStudioProjectRowBySlug(slug)
  const conceptRow = getStudioConceptRow(project.id, conceptId)
  const formatRow = getStudioConceptFormatRow(conceptRow.id, ratio)

  persistGeneratedVariant(project.id, conceptRow.id, formatRow.id, {
    conceptId,
    ratio,
    mode,
    prompt,
    imageUrl,
    resolution
  })

  return getStudioConceptById(slug, conceptId)
}

export function saveStudioConceptFinalVariants(
  slug: string,
  conceptId: string,
  generatedFormats: Array<{ ratio: string, promptDraft: string, imageUrl: string }>,
  resolution: string
): StudioConcept {
  const project = getStudioProjectRowBySlug(slug)
  const conceptRow = getStudioConceptRow(project.id, conceptId)
  const generatedFormatsWithRows = generatedFormats.map((generatedFormat) => ({
    ...generatedFormat,
    formatRow: getStudioConceptFormatRow(conceptRow.id, generatedFormat.ratio)
  }))

  persistFinalVariants(project.id, conceptRow, generatedFormatsWithRows, resolution)

  return getStudioConceptById(slug, conceptId)
}

export function getStudioConceptById(slug: string, conceptId: string): StudioConcept {
  return ensureConcept(getStudioProjectBySlug(slug).concepts.find((concept) => concept.id === conceptId))
}

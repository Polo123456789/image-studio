import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm'

import type {
  StudioBriefPayload,
  StudioConcept,
  StudioConceptFormat,
  StudioProject,
  StudioProjectListItem,
  StudioVariant
} from '../../shared/types/studio'
import { db } from '../db/client'
import {
  studioConceptFormats,
  studioConcepts,
  studioProjects,
  studioVariants
} from '../db/schema'

type StudioProjectRow = typeof studioProjects.$inferSelect
type StudioConceptRow = typeof studioConcepts.$inferSelect
type StudioConceptFormatRow = typeof studioConceptFormats.$inferSelect
type StudioVariantRow = typeof studioVariants.$inferSelect
type StudioTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

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

function toDate(value?: string | null) {
  return value ? new Date(value) : null
}

function serializeBrief(brief: StudioBriefPayload) {
  return JSON.stringify(brief)
}

function deserializeBrief(value: string): StudioBriefPayload {
  return JSON.parse(value) as StudioBriefPayload
}

function mapProjectListItem(project: StudioProjectRow): StudioProjectListItem {
  const brief = deserializeBrief(project.brief)
  const projectConceptRows = db.select({ approvedAt: studioConcepts.approvedAt })
    .from(studioConcepts)
    .where(and(eq(studioConcepts.projectId, project.id), isNull(studioConcepts.discardedAt)))
    .all()

  return {
    id: project.id,
    slug: project.slug,
    projectName: project.projectName,
    goal: brief.goal,
    conceptCount: projectConceptRows.length,
    hasApprovedConcepts: projectConceptRows.some((concept) => Boolean(concept.approvedAt)),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  }
}

function formatTimestamp(value: Date | null) {
  return value ? value.toISOString() : null
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

function mapProject(project: StudioProjectRow, concepts: StudioConcept[]): StudioProject {
  return {
    id: project.id,
    slug: project.slug,
    brief: deserializeBrief(project.brief),
    concepts,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  }
}

function mapConcepts(
  conceptRows: StudioConceptRow[],
  formatRows: StudioConceptFormatRow[],
  variantRows: StudioVariantRow[]
) {
  const variantsByFormatId = new Map<number, StudioVariant[]>()

  variantRows.forEach((variant) => {
    const nextVariant: StudioVariant = {
      id: variant.variantKey,
      label: variant.label,
      mode: variant.mode as StudioVariant['mode'],
      prompt: variant.prompt,
      imageUrl: variant.imageUrl,
      createdAt: variant.createdAt.toISOString()
    }
    const variants = variantsByFormatId.get(variant.formatId) || []

    variants.push(nextVariant)
    variantsByFormatId.set(variant.formatId, variants)
  })

  const formatsByConceptId = new Map<number, StudioConceptFormat[]>()

  formatRows.forEach((format) => {
    const nextFormat: StudioConceptFormat = {
      ratio: format.ratio,
      isPreviewSource: format.isPreviewSource,
      promptDraft: format.promptDraft,
      variants: variantsByFormatId.get(format.id) || [],
      activeVariantId: format.activeVariantKey
    }
    const formats = formatsByConceptId.get(format.conceptId) || []

    formats.push(nextFormat)
    formatsByConceptId.set(format.conceptId, formats)
  })

  return conceptRows.map((concept) => ({
    id: concept.conceptKey,
    title: concept.title,
    subtitle: concept.subtitle,
    rationale: concept.rationale,
    selectedRatio: concept.selectedRatio,
    approvedAt: formatTimestamp(concept.approvedAt),
    formats: formatsByConceptId.get(concept.id) || []
  }))
}

function listProjectConceptRows(projectId: number) {
  return db.select()
    .from(studioConcepts)
    .where(and(eq(studioConcepts.projectId, projectId), isNull(studioConcepts.discardedAt)))
    .orderBy(asc(studioConcepts.position), asc(studioConcepts.id))
    .all()
}

function listConceptFormatRows(conceptIds: number[]) {
  return db.select()
    .from(studioConceptFormats)
    .where(inArray(studioConceptFormats.conceptId, conceptIds))
    .orderBy(asc(studioConceptFormats.id))
    .all()
}

function listFormatVariantRows(formatIds: number[]) {
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

  const conceptIds = conceptRows.map((concept) => concept.id)
  const formatRows = listConceptFormatRows(conceptIds)

  if (!formatRows.length) {
    return mapConcepts(conceptRows, [], [])
  }

  const formatIds = formatRows.map((format) => format.id)
  const variantRows = listFormatVariantRows(formatIds)

  return mapConcepts(conceptRows, formatRows, variantRows)
}

function touchProject(tx: StudioTransaction, projectId: number, now: Date) {
  tx.update(studioProjects)
    .set({ updatedAt: now })
    .where(eq(studioProjects.id, projectId))
    .run()
}

function createConceptFormatKey(conceptId: number, ratio: string) {
  return `${conceptId}:${ratio}`
}

function discardMissingConceptRows(tx: StudioTransaction, projectId: number, concepts: StudioConcept[], now: Date) {
  const incomingConceptIds = new Set(concepts.map((concept) => concept.id))
  const existingConceptRows = tx.select()
    .from(studioConcepts)
    .where(eq(studioConcepts.projectId, projectId))
    .all()

  existingConceptRows.forEach((conceptRow) => {
    if (incomingConceptIds.has(conceptRow.conceptKey)) {
      return
    }

    tx.update(studioConcepts)
      .set({
        discardedAt: now,
        updatedAt: now
      })
      .where(eq(studioConcepts.id, conceptRow.id))
      .run()
  })
}

function upsertConceptRows(tx: StudioTransaction, projectId: number, concepts: StudioConcept[], now: Date) {
  concepts.forEach((concept, conceptIndex) => {
    tx.insert(studioConcepts)
      .values({
        projectId,
        conceptKey: concept.id,
        title: concept.title,
        subtitle: concept.subtitle,
        rationale: concept.rationale,
        selectedRatio: concept.selectedRatio,
        approvedAt: toDate(concept.approvedAt),
        position: conceptIndex,
        discardedAt: null,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [studioConcepts.projectId, studioConcepts.conceptKey],
        set: {
          title: concept.title,
          subtitle: concept.subtitle,
          rationale: concept.rationale,
          selectedRatio: concept.selectedRatio,
          approvedAt: toDate(concept.approvedAt),
          position: conceptIndex,
          discardedAt: null,
          updatedAt: now
        }
      })
      .run()
  })
}

function listPersistedConceptRows(tx: StudioTransaction, projectId: number, concepts: StudioConcept[]) {
  return tx.select()
    .from(studioConcepts)
    .where(and(eq(studioConcepts.projectId, projectId), inArray(studioConcepts.conceptKey, concepts.map((concept) => concept.id))))
    .all()
}

function createConceptRowMap(conceptRows: StudioConceptRow[]) {
  return new Map(conceptRows.map((concept) => [concept.conceptKey, concept]))
}

function upsertFormatRows(
  tx: StudioTransaction,
  concepts: StudioConcept[],
  conceptRowByKey: Map<string, StudioConceptRow>,
  now: Date
) {
  concepts.forEach((concept) => {
    const conceptRow = conceptRowByKey.get(concept.id)

    if (!conceptRow) {
      return
    }

    concept.formats.forEach((format) => {
      tx.insert(studioConceptFormats)
        .values({
          conceptId: conceptRow.id,
          ratio: format.ratio,
          isPreviewSource: format.isPreviewSource,
          promptDraft: format.promptDraft,
          activeVariantKey: format.activeVariantId,
          createdAt: now,
          updatedAt: now
        })
        .onConflictDoUpdate({
          target: [studioConceptFormats.conceptId, studioConceptFormats.ratio],
          set: {
            isPreviewSource: format.isPreviewSource,
            promptDraft: format.promptDraft,
            activeVariantKey: format.activeVariantId,
            updatedAt: now
          }
        })
        .run()
    })
  })
}

function listPersistedFormatRows(tx: StudioTransaction, conceptRows: StudioConceptRow[]) {
  return tx.select()
    .from(studioConceptFormats)
    .where(inArray(studioConceptFormats.conceptId, conceptRows.map((concept) => concept.id)))
    .all()
}

function removeDeletedFormatRows(
  tx: StudioTransaction,
  concepts: StudioConcept[],
  conceptRowByKey: Map<string, StudioConceptRow>,
  formatRows: StudioConceptFormatRow[]
) {
  concepts.forEach((concept) => {
    const conceptRow = conceptRowByKey.get(concept.id)

    if (!conceptRow) {
      return
    }

    const incomingRatios = new Set(concept.formats.map((format) => format.ratio))

    formatRows
      .filter((format) => format.conceptId === conceptRow.id && !incomingRatios.has(format.ratio))
      .forEach((format) => {
        tx.delete(studioVariants)
          .where(eq(studioVariants.formatId, format.id))
          .run()

        tx.delete(studioConceptFormats)
          .where(eq(studioConceptFormats.id, format.id))
          .run()
      })
  })
}

function createFormatRowMap(formatRows: StudioConceptFormatRow[]) {
  return new Map(
    formatRows.map((format) => [createConceptFormatKey(format.conceptId, format.ratio), format])
  )
}

function upsertVariantRows(
  tx: StudioTransaction,
  concepts: StudioConcept[],
  conceptRowByKey: Map<string, StudioConceptRow>,
  formatRowByConceptAndRatio: Map<string, StudioConceptFormatRow>
) {
  concepts.forEach((concept) => {
    const conceptRow = conceptRowByKey.get(concept.id)

    if (!conceptRow) {
      return
    }

    concept.formats.forEach((format) => {
      const formatRow = formatRowByConceptAndRatio.get(createConceptFormatKey(conceptRow.id, format.ratio))

      if (!formatRow) {
        return
      }

      format.variants.forEach((variant) => {
        tx.insert(studioVariants)
          .values({
            formatId: formatRow.id,
            variantKey: variant.id,
            label: variant.label,
            mode: variant.mode,
            prompt: variant.prompt,
            imageUrl: variant.imageUrl,
            createdAt: new Date(variant.createdAt)
          })
          .onConflictDoUpdate({
            target: [studioVariants.formatId, studioVariants.variantKey],
            set: {
              label: variant.label,
              mode: variant.mode,
              prompt: variant.prompt,
              imageUrl: variant.imageUrl
            }
          })
          .run()
      })
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

  return projects.map(mapProjectListItem)
}

export async function createStudioProject(brief: StudioBriefPayload): Promise<StudioProject> {
  const now = new Date()
  const slug = await generateUniqueSlug(brief.projectName)

  db.insert(studioProjects)
    .values({
      slug,
      projectName: brief.projectName.trim(),
      brief: serializeBrief(brief),
      createdAt: now,
      updatedAt: now
    })
    .run()

  return getStudioProjectBySlug(slug)
}

export function updateStudioProjectBrief(slug: string, brief: StudioBriefPayload): StudioProject {
  const project = getStudioProjectRowBySlug(slug)

  db.update(studioProjects)
    .set({
      projectName: brief.projectName.trim(),
      brief: serializeBrief(brief),
      updatedAt: new Date()
    })
    .where(eq(studioProjects.id, project.id))
    .run()

  return getStudioProjectBySlug(slug)
}

export function saveStudioConcepts(slug: string, concepts: StudioConcept[]): StudioProject {
  const project = getStudioProjectRowBySlug(slug)

  db.transaction((tx) => {
    const now = new Date()
    discardMissingConceptRows(tx, project.id, concepts, now)
    upsertConceptRows(tx, project.id, concepts, now)

    if (!concepts.length) {
      touchProject(tx, project.id, now)

      return
    }

    const persistedConceptRows = listPersistedConceptRows(tx, project.id, concepts)
    const conceptRowByKey = createConceptRowMap(persistedConceptRows)

    upsertFormatRows(tx, concepts, conceptRowByKey, now)

    const persistedFormatRows = listPersistedFormatRows(tx, persistedConceptRows)

    removeDeletedFormatRows(tx, concepts, conceptRowByKey, persistedFormatRows)

    const formatRowByConceptAndRatio = createFormatRowMap(persistedFormatRows)

    upsertVariantRows(tx, concepts, conceptRowByKey, formatRowByConceptAndRatio)

    touchProject(tx, project.id, now)
  })

  return getStudioProjectBySlug(slug)
}

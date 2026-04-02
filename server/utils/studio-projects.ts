import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm'

import type {
  StudioBriefPayload,
  StudioConcept,
  StudioConceptFormat,
  StudioProject,
  StudioVariant
} from '../../shared/types/studio'
import { db } from '../db/client'
import {
  studioConceptFormats,
  studioConcepts,
  studioProjects,
  studioVariants
} from '../db/schema'

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

function formatTimestamp(value: Date | null) {
  return value ? value.toISOString() : null
}

function ensureProject(project?: typeof studioProjects.$inferSelect) {
  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Studio project not found'
    })
  }

  return project
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

function mapProject(project: typeof studioProjects.$inferSelect, concepts: StudioConcept[]): StudioProject {
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
  conceptRows: Array<typeof studioConcepts.$inferSelect>,
  formatRows: Array<typeof studioConceptFormats.$inferSelect>,
  variantRows: Array<typeof studioVariants.$inferSelect>
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

export function getStudioProjectBySlug(slug: string): StudioProject {
  const project = ensureProject(db.query.studioProjects.findFirst({
    where: eq(studioProjects.slug, slug)
  }).sync())

  const conceptRows = db.select()
    .from(studioConcepts)
    .where(and(eq(studioConcepts.projectId, project.id), isNull(studioConcepts.discardedAt)))
    .orderBy(asc(studioConcepts.position), asc(studioConcepts.id))
    .all()

  if (!conceptRows.length) {
    return mapProject(project, [])
  }

  const conceptIds = conceptRows.map((concept) => concept.id)
  const formatRows = db.select()
    .from(studioConceptFormats)
    .where(inArray(studioConceptFormats.conceptId, conceptIds))
    .orderBy(asc(studioConceptFormats.id))
    .all()

  if (!formatRows.length) {
    return mapProject(project, mapConcepts(conceptRows, [], []))
  }

  const formatIds = formatRows.map((format) => format.id)
  const variantRows = db.select()
    .from(studioVariants)
    .where(inArray(studioVariants.formatId, formatIds))
    .orderBy(desc(studioVariants.createdAt), desc(studioVariants.id))
    .all()

  return mapProject(project, mapConcepts(conceptRows, formatRows, variantRows))
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
  const project = ensureProject(db.query.studioProjects.findFirst({
    where: eq(studioProjects.slug, slug)
  }).sync())

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
  const project = ensureProject(db.query.studioProjects.findFirst({
    where: eq(studioProjects.slug, slug)
  }).sync())

  db.transaction((tx) => {
    const now = new Date()
    const incomingConceptIds = new Set(concepts.map((concept) => concept.id))
    const existingConceptRows = tx.select()
      .from(studioConcepts)
      .where(eq(studioConcepts.projectId, project.id))
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

    concepts.forEach((concept, conceptIndex) => {
      tx.insert(studioConcepts)
        .values({
          projectId: project.id,
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

    if (!concepts.length) {
      tx.update(studioProjects)
        .set({ updatedAt: now })
        .where(eq(studioProjects.id, project.id))
        .run()

      return
    }

    const persistedConceptRows = tx.select()
      .from(studioConcepts)
      .where(and(eq(studioConcepts.projectId, project.id), inArray(studioConcepts.conceptKey, concepts.map((concept) => concept.id))))
      .all()
    const conceptRowByKey = new Map(persistedConceptRows.map((concept) => [concept.conceptKey, concept]))

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

    const persistedFormatRows = tx.select()
      .from(studioConceptFormats)
      .where(inArray(studioConceptFormats.conceptId, persistedConceptRows.map((concept) => concept.id)))
      .all()
    const formatRowByConceptAndRatio = new Map(
      persistedFormatRows.map((format) => [`${format.conceptId}:${format.ratio}`, format])
    )

    concepts.forEach((concept) => {
      const conceptRow = conceptRowByKey.get(concept.id)

      if (!conceptRow) {
        return
      }

      concept.formats.forEach((format) => {
        const formatRow = formatRowByConceptAndRatio.get(`${conceptRow.id}:${format.ratio}`)

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

    tx.update(studioProjects)
      .set({ updatedAt: now })
      .where(eq(studioProjects.id, project.id))
      .run()
  })

  return getStudioProjectBySlug(slug)
}

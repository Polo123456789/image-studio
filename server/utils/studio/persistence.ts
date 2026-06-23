import { and, desc, eq, inArray, isNull } from 'drizzle-orm'

import type { StudioConcept, StudioVariantMode } from '../../../shared/types/studio'
import { db } from '../../db/client'
import {
  studioConceptFormats,
  studioConcepts,
  studioProjects,
  studioVariants
} from '../../db/schema'
import type { StudioConceptFormatRow, StudioConceptRow, StudioTransaction } from './types'
import { createGeneratedVariant } from './variants'

function toDate(value?: string | null) {
  return value ? new Date(value) : null
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
        creativeStyleId: concept.creativeStyleId ?? null,
        creativeStyleName: concept.creativeStyleName ?? null,
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
          creativeStyleId: concept.creativeStyleId ?? null,
          creativeStyleName: concept.creativeStyleName ?? null,
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
  if (!concepts.length) {
    return []
  }

  return tx.select()
    .from(studioConcepts)
    .where(and(eq(studioConcepts.projectId, projectId), inArray(studioConcepts.conceptKey, concepts.map((concept) => concept.id))))
    .all()
}

function createConceptRowMap(conceptRows: StudioConceptRow[]) {
  return new Map(conceptRows.map((concept) => [concept.conceptKey, concept]))
}

function insertConceptRows(tx: StudioTransaction, projectId: number, concepts: StudioConcept[], startPosition: number, now: Date) {
  concepts.forEach((concept, conceptIndex) => {
    tx.insert(studioConcepts)
      .values({
        projectId,
        conceptKey: concept.id,
        title: concept.title,
        subtitle: concept.subtitle,
        rationale: concept.rationale,
        creativeStyleId: concept.creativeStyleId ?? null,
        creativeStyleName: concept.creativeStyleName ?? null,
        approvedAt: toDate(concept.approvedAt),
        position: startPosition + conceptIndex,
        discardedAt: null,
        createdAt: now,
        updatedAt: now
      })
      .run()
  })
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
  if (!conceptRows.length) {
    return []
  }

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

function countFormatVariants(tx: StudioTransaction, formatId: number) {
  return tx.select({ id: studioVariants.id })
    .from(studioVariants)
    .where(eq(studioVariants.formatId, formatId))
    .all().length
}

export function replaceProjectConcepts(projectId: number, concepts: StudioConcept[]) {
  db.transaction((tx) => {
    const now = new Date()
    discardMissingConceptRows(tx, projectId, concepts, now)
    upsertConceptRows(tx, projectId, concepts, now)

    if (!concepts.length) {
      touchProject(tx, projectId, now)

      return
    }

    const persistedConceptRows = listPersistedConceptRows(tx, projectId, concepts)
    const conceptRowByKey = createConceptRowMap(persistedConceptRows)

    upsertFormatRows(tx, concepts, conceptRowByKey, now)

    const persistedFormatRows = listPersistedFormatRows(tx, persistedConceptRows)

    removeDeletedFormatRows(tx, concepts, conceptRowByKey, persistedFormatRows)
    upsertVariantRows(tx, concepts, conceptRowByKey, createFormatRowMap(persistedFormatRows))
    touchProject(tx, projectId, now)
  })
}

export function appendProjectConcepts(projectId: number, concepts: StudioConcept[]) {
  db.transaction((tx) => {
    const now = new Date()
    const lastPositionRow = tx.select({ position: studioConcepts.position })
      .from(studioConcepts)
      .where(and(eq(studioConcepts.projectId, projectId), isNull(studioConcepts.discardedAt)))
      .orderBy(desc(studioConcepts.position), desc(studioConcepts.id))
      .limit(1)
      .get()
    const startPosition = lastPositionRow ? lastPositionRow.position + 1 : 0

    insertConceptRows(tx, projectId, concepts, startPosition, now)

    const persistedConceptRows = listPersistedConceptRows(tx, projectId, concepts)
    const conceptRowByKey = createConceptRowMap(persistedConceptRows)

    upsertFormatRows(tx, concepts, conceptRowByKey, now)

    const persistedFormatRows = listPersistedFormatRows(tx, persistedConceptRows)
    const formatRowByConceptAndRatio = createFormatRowMap(persistedFormatRows)

    upsertVariantRows(tx, concepts, conceptRowByKey, formatRowByConceptAndRatio)
    touchProject(tx, projectId, now)
  })
}

export function persistSelectedVariant(projectId: number, formatRowId: number, activeVariantId: string) {
  const now = new Date()

  db.transaction((tx) => {
    tx.update(studioConceptFormats)
      .set({
        activeVariantKey: activeVariantId,
        updatedAt: now
      })
      .where(eq(studioConceptFormats.id, formatRowId))
      .run()

    touchProject(tx, projectId, now)
  })
}

export function persistFormatPrompt(projectId: number, conceptRowId: number, formatRowId: number, promptDraft: string) {
  const now = new Date()

  db.transaction((tx) => {
    tx.update(studioConceptFormats)
      .set({
        promptDraft,
        updatedAt: now
      })
      .where(eq(studioConceptFormats.id, formatRowId))
      .run()

    tx.update(studioConcepts)
      .set({ updatedAt: now })
      .where(eq(studioConcepts.id, conceptRowId))
      .run()

    touchProject(tx, projectId, now)
  })
}

export function persistDiscardedConcept(projectId: number, conceptRowId: number) {
  const now = new Date()

  db.transaction((tx) => {
    tx.update(studioConcepts)
      .set({
        discardedAt: now,
        updatedAt: now
      })
      .where(eq(studioConcepts.id, conceptRowId))
      .run()

    touchProject(tx, projectId, now)
  })
}

export function persistGeneratedVariant(
  projectId: number,
  conceptRowId: number,
  formatRowId: number,
  input: {
    conceptId: string
    ratio: string
    mode: StudioVariantMode
    prompt: string
    imageUrl: string
    resolution?: string
  }
) {
  const now = new Date()

  db.transaction((tx) => {
    const versionNumber = countFormatVariants(tx, formatRowId) + 1
    const variant = createGeneratedVariant(
      input.conceptId,
      input.ratio,
      versionNumber,
      input.mode,
      input.prompt,
      input.imageUrl,
      input.resolution
    )

    tx.insert(studioVariants)
      .values({
        formatId: formatRowId,
        variantKey: variant.id,
        label: variant.label,
        mode: variant.mode,
        prompt: variant.prompt,
        imageUrl: variant.imageUrl,
        createdAt: new Date(variant.createdAt)
      })
      .run()

    tx.update(studioConceptFormats)
      .set({
        promptDraft: input.prompt,
        activeVariantKey: variant.id,
        updatedAt: now
      })
      .where(eq(studioConceptFormats.id, formatRowId))
      .run()

    tx.update(studioConcepts)
      .set({ updatedAt: now })
      .where(eq(studioConcepts.id, conceptRowId))
      .run()

    touchProject(tx, projectId, now)
  })
}

export function persistFinalVariants(
  projectId: number,
  conceptRow: StudioConceptRow,
  generatedFormats: Array<{ ratio: string, promptDraft: string, imageUrl: string, formatRow: StudioConceptFormatRow }>,
  resolution: string
) {
  const generatedAt = new Date()

  db.transaction((tx) => {
    generatedFormats.forEach((generatedFormat) => {
      const formatRow = generatedFormat.formatRow
      const versionNumber = countFormatVariants(tx, formatRow.id) + 1
      const variant = createGeneratedVariant(
        conceptRow.conceptKey,
        generatedFormat.ratio,
        versionNumber,
        'final',
        generatedFormat.promptDraft,
        generatedFormat.imageUrl,
        resolution
      )

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
        .run()

      tx.update(studioConceptFormats)
        .set({
          promptDraft: generatedFormat.promptDraft,
          activeVariantKey: variant.id,
          updatedAt: generatedAt
        })
        .where(eq(studioConceptFormats.id, formatRow.id))
        .run()
    })

    tx.update(studioConcepts)
      .set({
        approvedAt: conceptRow.approvedAt || generatedAt,
        updatedAt: generatedAt
      })
      .where(eq(studioConcepts.id, conceptRow.id))
      .run()

    touchProject(tx, projectId, generatedAt)
  })
}

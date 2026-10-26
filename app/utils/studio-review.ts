import type { StudioConcept, StudioVariant } from '../../shared/types/studio'

export interface StudioReviewEntry {
  key: string
  conceptId: string
  conceptTitle: string
  conceptIndex: number
  ratio: string
  variant: StudioVariant
}

export function studioReviewKey(conceptId: string, ratio: string, variantId: string) {
  return JSON.stringify([conceptId, ratio, variantId])
}

export function studioReviewEntries(concepts: StudioConcept[]): StudioReviewEntry[] {
  return concepts.flatMap((concept, conceptIndex) => concept.formats.flatMap(format =>
    format.variants.filter(variant => Boolean(variant.imageUrl?.trim())).map(variant => ({
      key: studioReviewKey(concept.id, format.ratio, variant.id),
      conceptId: concept.id,
      conceptTitle: concept.title,
      conceptIndex,
      ratio: format.ratio,
      variant
    }))
  ))
}

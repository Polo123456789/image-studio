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

export function sortConceptsByReview(concepts: StudioConcept[]): StudioConcept[] {
  const rank = (concept: StudioConcept) => {
    const images = concept.formats.flatMap(format => format.variants)
      .filter(variant => Boolean(variant.imageUrl?.trim()))
    if (images.length && images.every(image => image.reviewRating === 'good')) return 0
    if (images.length && images.every(image => image.reviewRating === 'bad')) return 2
    return 1
  }
  return concepts.map(concept => ({ concept, rank: rank(concept) }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ concept }) => concept)
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

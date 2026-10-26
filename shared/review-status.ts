import type { StudioConcept } from './types/studio'

export function studioConceptReviewStatus(concept: StudioConcept): 'good' | 'mixed' | 'bad' {
  const images = concept.formats.flatMap(format => format.variants)
    .filter(variant => Boolean(variant.imageUrl?.trim()))
  if (images.length && images.every(image => image.reviewRating === 'good')) return 'good'
  if (images.length && images.every(image => image.reviewRating === 'bad')) return 'bad'
  return 'mixed'
}

export function sortConceptsByReview(concepts: StudioConcept[]): StudioConcept[] {
  const ranks = { good: 0, mixed: 1, bad: 2 }
  return concepts.map(concept => ({ concept, rank: ranks[studioConceptReviewStatus(concept)] }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ concept }) => concept)
}


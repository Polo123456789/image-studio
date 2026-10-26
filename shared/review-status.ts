import type { StudioConcept } from './types/studio'

export function studioConceptReviewSummary(concept: StudioConcept) {
  const images = concept.formats.flatMap(format => format.variants)
    .filter(variant => Boolean(variant.imageUrl?.trim()))
  const total = images.length
  const reviewed = images.filter(image => image.reviewRating === 'good' || image.reviewRating === 'bad').length
  const status: 'good' | 'mixed' | 'bad' = total && images.every(image => image.reviewRating === 'good') ? 'good'
    : total && images.every(image => image.reviewRating === 'bad') ? 'bad' : 'mixed'
  const label = !total ? 'Sin imágenes' : !reviewed ? 'Sin revisar' : reviewed < total ? 'Pendiente'
    : status === 'good' ? 'Todas buenas' : status === 'bad' ? 'Todas malas' : 'Mixto'
  return { status, total, reviewed, label }
}

export function studioConceptReviewStatus(concept: StudioConcept): 'good' | 'mixed' | 'bad' {
  return studioConceptReviewSummary(concept).status
}

export function sortConceptsByReview(concepts: StudioConcept[]): StudioConcept[] {
  const ranks = { good: 0, mixed: 1, bad: 2 }
  return concepts.map(concept => ({ concept, rank: ranks[studioConceptReviewStatus(concept)] }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ concept }) => concept)
}


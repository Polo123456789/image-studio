import type { StudioConcept } from './types/studio'
import { studioConceptReviewStatus } from './review-status'

export type StudioExportScope = 'good' | 'mixed' | 'all'

export function activeStudioExportImages(concepts: StudioConcept[]) {
  return concepts.flatMap(concept => concept.formats.flatMap(format => {
    const variant = format.variants.find(item => item.id === format.activeVariantId)
    return variant?.mode === 'final' && variant.imageUrl?.trim() ? [{ concept, format, variant }] : []
  }))
}

export function selectStudioExportImages(concepts: StudioConcept[], scope: StudioExportScope = 'good') {
  const images = activeStudioExportImages(concepts)
  // Until review starts, preserve the existing export of all active final images.
  if (scope === 'all' || !images.some(image => image.variant.reviewRating)) return images
  if (scope === 'good') return images.filter(image => image.variant.reviewRating === 'good')
  const mixedConcepts = new Set(concepts.filter(concept => studioConceptReviewStatus(concept) === 'mixed').map(concept => concept.id))
  return images.filter(image => image.variant.reviewRating === 'good' || mixedConcepts.has(image.concept.id))
}

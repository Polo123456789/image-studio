import { expect, test } from 'bun:test'
import type { StudioConcept, StudioReviewRating } from '../../shared/types/studio'
import { studioConceptReviewStatus, sortConceptsByReview } from '../../shared/review-status'

function concept(id: string, ratings: StudioReviewRating[]): StudioConcept {
  return {
    id, title: id, subtitle: '', rationale: '', selectedRatio: '1:1', approvedAt: null,
    formats: ratings.map((reviewRating, index) => ({
      ratio: String(index), isPreviewSource: false, promptDraft: '', generationError: null,
      activeVariantId: 'image',
      variants: [{ id: 'image', label: '', mode: 'final', prompt: '', imageUrl: '/image.png', thumbnailUrl: null, createdAt: '', reviewRating }]
    }))
  }
}

test('orders all good, mixed or pending, then all bad without mutating the source', () => {
  const concepts = [concept('bad', ['bad', 'bad']), concept('mixed', ['good', 'bad']),
    concept('good', ['good', 'good']), concept('pending', ['good', null]),
    concept('empty', []), concept('good2', ['good']), concept('bad2', ['bad'])]
  const original = [...concepts]
  expect(sortConceptsByReview(concepts).map(item => item.id))
    .toEqual(['good', 'good2', 'mixed', 'pending', 'empty', 'bad', 'bad2'])
  expect(concepts).toEqual(original)
})

test('includes historical versions and ignores variants without an image', () => {
  const mixed = concept('mixed', ['good'])
  mixed.formats[0]!.variants.push({ ...mixed.formats[0]!.variants[0]!, id: 'old', reviewRating: 'bad' })
  const good = concept('good', ['good'])
  good.formats[0]!.variants.push({ ...good.formats[0]!.variants[0]!, id: 'failed', imageUrl: '', reviewRating: null })
  expect(sortConceptsByReview([mixed, good]).map(item => item.id)).toEqual(['good', 'mixed'])
})

test('uses the same status for labels and sorting, keeping empty and pending concepts mixed', () => {
  expect(studioConceptReviewStatus(concept('good', ['good']))).toBe('good')
  expect(studioConceptReviewStatus(concept('bad', ['bad']))).toBe('bad')
  for (const ratings of [[], [null], ['good', null], ['good', 'bad']] as StudioReviewRating[][]) {
    expect(studioConceptReviewStatus(concept('mixed', ratings))).toBe('mixed')
  }
})

import { describe, expect, test } from 'bun:test'
import { parseStudioReviewPayload } from './reviews'

describe('review request validation', () => {
  const base = { conceptId: 'concept', ratio: '1:1', variantId: 'version' }
  test('accepts only good, bad or explicit null for clearing a review', () => {
    for (const rating of ['good', 'bad', null] as const) {
      expect(parseStudioReviewPayload({ ...base, rating }).rating).toBe(rating)
    }
    for (const value of [null, [], 'good', {}, base, { ...base, rating: '' }, { ...base, rating: false }, { ...base, rating: 'great' }, { ...base, rating: 0 }, { ...base, rating: [] }]) {
      expect(() => parseStudioReviewPayload(value)).toThrow()
    }
  })
  test('requires all scoped image identifiers', () => {
    for (const key of ['conceptId', 'ratio', 'variantId']) {
      for (const value of ['', '  ', null, 12]) {
        expect(() => parseStudioReviewPayload({ ...base, rating: 'good', [key]: value })).toThrow()
      }
    }
  })
})

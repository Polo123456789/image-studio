import { afterEach, describe, expect, test } from 'bun:test'
import { ref } from 'vue'
import type { StudioConcept, StudioReviewRating } from '../../shared/types/studio'
import { useStudioReview } from './useStudioReview'

const originalFetch = globalThis.$fetch
// Only the transport is stubbed; queue state and undo use the real composable.
function transport(handler: (rating: StudioReviewRating) => Promise<{ rating: StudioReviewRating }>) {
  globalThis.$fetch = ((_url: string, options: { body: { rating: StudioReviewRating } }) => handler(options.body.rating)) as typeof $fetch
}
afterEach(() => { globalThis.$fetch = originalFetch })
function setup() {
  const concepts = ref<StudioConcept[]>([{
    id: 'one', title: 'Concepto', subtitle: '', rationale: '', selectedRatio: '1:1', approvedAt: null,
    formats: [{ ratio: '1:1', isPreviewSource: true, promptDraft: 'prompt', generationError: null, activeVariantId: 'new', variants: [
      { id: 'new', label: 'Nueva', mode: 'preview', prompt: 'prompt', imageUrl: '/new.jpg', thumbnailUrl: null, createdAt: '2026-10-23T00:00:00Z' },
      { id: 'old', label: 'Anterior', mode: 'preview', prompt: 'prompt', imageUrl: '/old.jpg', thumbnailUrl: null, createdAt: '2026-10-22T00:00:00Z' },
      { id: 'empty', label: 'Sin imagen', mode: 'preview', prompt: 'prompt', imageUrl: '', thumbnailUrl: null, createdAt: '2026-10-22T00:00:00Z' }
    ] }]
  }])
  transport(async rating => ({ rating }))
  const slug = ref('project')
  const queue = useStudioReview(concepts, slug)
  return { ...queue, concepts, slug }
}

describe('individual review queue', () => {
  test('includes historical images, skips empty images and keeps deferred images pending', async () => {
    const review = setup()
    expect(review.reviewPending.value).toHaveLength(2)
    review.openReview()
    review.reviewSkip()
    expect(review.reviewCurrent.value?.variant.id).toBe('old')
    await review.reviewRate('bad')
    expect(review.reviewCurrent.value).toBeUndefined()
    expect(review.reviewPending.value).toHaveLength(1)
    review.closeReview()
    review.openReview()
    expect(review.reviewCurrent.value?.variant.id).toBe('new')
    expect(review.concepts.value[0]?.formats[0]?.activeVariantId).toBe('new')
  })
  test('undo restores the evaluated version without changing the active image', async () => {
    const review = setup()
    await review.reviewRate('good')
    await review.reviewRate('bad')
    expect(review.reviewPending.value).toHaveLength(0)
    await review.reviewUndo()
    expect(review.reviewCurrent.value?.variant.id).toBe('old')
    expect(review.reviewPending.value).toHaveLength(1)
    expect(review.reviewEntries.value[0]?.variant.reviewRating).toBe('good')
    expect(review.concepts.value[0]?.formats[0]?.activeVariantId).toBe('new')
    await review.reviewUndo()
    expect(review.reviewPending.value).toHaveLength(2)
    expect(review.reviewCanUndo.value).toBe(false)
  })
  test('inline evaluations toggle and can be changed or cleared', async () => {
    const review = setup()
    await review.reviewInline('one', '1:1', 'new', 'good')
    await review.reviewInline('one', '1:1', 'new', 'bad')
    expect(review.reviewEntries.value[0]?.variant.reviewRating).toBe('bad')
    await review.reviewInline('one', '1:1', 'new', 'bad')
    expect(review.reviewEntries.value[0]?.variant.reviewRating).toBeNull()
    expect(review.reviewPending.value).toHaveLength(2)
  })
  test('waits for persistence, blocks double decisions and preserves the image on failure', async () => {
    const review = setup()
    let reject!: (error: Error) => void
    transport(() => new Promise((_resolve, fail) => { reject = fail }))
    const request = review.reviewRate('good')
    expect(review.reviewSaving.value).toBe(true)
    await review.reviewRate('bad')
    expect(review.reviewPending.value).toHaveLength(2)
    reject(new Error('Sin conexión'))
    await request
    expect(review.reviewCurrent.value?.variant.id).toBe('new')
    expect(review.reviewPending.value).toHaveLength(2)
    expect(review.reviewCanUndo.value).toBe(false)
    expect(review.reviewError.value).toContain('Sin conexión')
    expect(review.reviewSaving.value).toBe(false)
  })
  test('merges confirmed ratings into delayed generation responses, including clearing a rating', async () => {
    const review = setup()
    const snapshot = structuredClone(JSON.parse(JSON.stringify(review.concepts.value[0]))) as StudioConcept
    await review.reviewRate('good')
    expect(review.mergeReviewConcept(snapshot).formats[0]!.variants[0]!.reviewRating).toBe('good')
    await review.reviewUndo()
    const staleRatedSnapshot = review.mergeReviewConcept(snapshot)
    staleRatedSnapshot.formats[0]!.variants[0]!.reviewRating = 'good'
    expect(review.mergeReviewConcept(staleRatedSnapshot).formats[0]!.variants[0]!.reviewRating).toBeNull()
  })
  test('applies to the latest concept state after generation has finished', async () => {
    const review = setup()
    let release!: () => void
    transport(() => new Promise(resolve => { release = () => resolve({ rating: 'good' }) }))
    const request = review.reviewRate('good')
    review.concepts.value[0]!.formats[0]!.variants.unshift({ ...review.reviewEntries.value[0]!.variant, id: 'regenerated', reviewRating: null })
    review.concepts.value[0]!.formats[0]!.activeVariantId = 'regenerated'
    release()
    await request
    expect(review.reviewEntries.value.find(entry => entry.variant.id === 'new')?.variant.reviewRating).toBe('good')
    expect(review.reviewCurrent.value?.variant.id).toBe('regenerated')
    expect(review.concepts.value[0]!.formats[0]!.activeVariantId).toBe('regenerated')
  })
})

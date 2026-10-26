import { afterEach, describe, expect, test } from 'bun:test'
import { ref } from 'vue'
import type { StudioConcept, StudioConfirmedReviewRatings, StudioReviewRating } from '../../shared/types/studio'
import type { StudioReviewEntry } from '../utils/studio-review'
import { useStudioReview } from './useStudioReview'

const originalFetch = globalThis.$fetch
// Only the transport is stubbed; queue state and undo use the real composable.
function transport(handler: (rating: StudioReviewRating) => Promise<{ rating: StudioReviewRating }>) {
  globalThis.$fetch = ((_url: string, options: { body: { rating: StudioReviewRating } }) => handler(options.body.rating)) as typeof $fetch
}
afterEach(() => { globalThis.$fetch = originalFetch })
function setup(regenerate?: (entry: StudioReviewEntry) => Promise<void>, confirmations = ref<StudioConfirmedReviewRatings>({})) {
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
  const queue = useStudioReview(concepts, slug, regenerate, () => true, confirmations)
  queue.openReview()
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
  test('a previous editor preserves a newer rating saved by a remounted editor', async () => {
    const confirmations = ref<StudioConfirmedReviewRatings>({})
    const previous = setup(undefined, confirmations)
    await previous.reviewRate('bad')
    const current = useStudioReview(previous.concepts, previous.slug, undefined, () => true, confirmations)
    await current.reviewInline('one', '1:1', 'new', 'good')
    const response = structuredClone(JSON.parse(JSON.stringify(previous.concepts.value[0]))) as StudioConcept
    expect(previous.mergeReviewConcept(response).formats[0]!.variants[0]!.reviewRating).toBe('good')
    await current.reviewInline('one', '1:1', 'new', 'good')
    expect(previous.mergeReviewConcept(response).formats[0]!.variants[0]!.reviewRating).toBeNull()
  })
  test('shared confirmations do not cross project boundaries with matching version IDs', async () => {
    const confirmations = ref<StudioConfirmedReviewRatings>({})
    const first = setup(undefined, confirmations)
    const snapshot = structuredClone(JSON.parse(JSON.stringify(first.concepts.value[0]))) as StudioConcept
    await first.reviewRate('bad')
    const other = useStudioReview(ref([snapshot]), ref('other-project'), undefined, () => true, confirmations)
    expect(other.mergeReviewConcept(snapshot).formats[0]!.variants[0]!.reviewRating).toBeUndefined()
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
    expect(review.reviewCurrent.value?.variant.id).toBe('old')
    expect(review.reviewAvailable.value.map(entry => entry.variant.id)).toEqual(['old', 'regenerated'])
    expect(review.concepts.value[0]!.formats[0]!.activeVariantId).toBe('regenerated')
  })
})

function deferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
async function settled() {
  await new Promise(resolve => setTimeout(resolve, 0))
}
function appendReplacement(review: ReturnType<typeof setup>, entry: StudioReviewEntry) {
  // Server responses place newest versions first. Review must still append at the tail.
  review.concepts.value[0]!.formats[0]!.variants.unshift({ ...entry.variant, id: 'replacement', reviewRating: null, reviewExcluded: false })
}

describe('regeneration during individual review', () => {
  test('waits for the bad rating to persist, blocks duplicate clicks and does not generate if saving fails', async () => {
    let generated = 0
    const review = setup(async () => { generated++ })
    let fail!: (error: Error) => void
    transport(rating => {
      expect(rating).toBe('bad')
      return new Promise((_resolve, reject) => { fail = reject })
    })
    const request = review.reviewRegenerate()
    expect(review.reviewSaving.value).toBe(true)
    expect(generated).toBe(0)
    expect(review.reviewCurrent.value?.variant.id).toBe('new')
    await review.reviewRegenerate()
    fail(new Error('No se guardó'))
    await request
    expect(generated).toBe(0)
    expect(review.reviewPending.value).toHaveLength(2)
    expect(review.reviewError.value).toContain('No se guardó')
  })
  test('the bad rating can be undone after regeneration, preserving the unreviewed replacement', async () => {
    const review = setup(async entry => { appendReplacement(review, entry) })
    await review.reviewRegenerate()
    await settled()
    expect(review.reviewCanUndo.value).toBe(true)
    await review.reviewUndo()
    const source = review.concepts.value[0]!.formats[0]!.variants.find(v => v.id === 'new')!
    expect(source.reviewRating).toBeNull()
    expect(review.reviewPending.value.map(entry => entry.variant.id)).toContain('new')
    expect(review.reviewPending.value.map(entry => entry.variant.id)).toContain('replacement')
  })
  test('marks the source bad before generating and appends the unreviewed replacement behind the existing queue', async () => {
    const gate = deferred()
    const review = setup(async entry => { await gate.promise; appendReplacement(review, entry) })
    await review.reviewRegenerate()
    expect(review.reviewCurrent.value?.variant.id).toBe('old')
    expect(review.reviewRegeneratingCount.value).toBe(1)
    expect(review.reviewPending.value).toHaveLength(1)
    expect(review.concepts.value[0]!.formats[0]!.variants.find(v => v.id === 'new')!.reviewRating).toBe('bad')
    gate.resolve()
    await settled()
    expect(review.reviewRegeneratingCount.value).toBe(0)
    expect(review.reviewAvailable.value.map(entry => entry.variant.id)).toEqual(['old', 'replacement'])
    expect(review.reviewCurrent.value?.variant.id).toBe('old')
    expect(review.concepts.value[0]!.formats[0]!.variants.find(v => v.id === 'new')!.reviewExcluded).toBeUndefined()
    await review.reviewRate('good')
    expect(review.reviewCurrent.value?.variant.id).toBe('replacement')
    expect(review.mergeReviewConcept({ ...review.concepts.value[0]!, formats: [{ ...review.concepts.value[0]!.formats[0]!, variants: [{ ...review.concepts.value[0]!.formats[0]!.variants.find(v => v.id === 'new')!, reviewRating: null }] }] }).formats[0]!.variants[0]!.reviewRating).toBe('bad')
  })
  test('does not restart a finished review when the replacement arrives late', async () => {
    const gate = deferred()
    const review = setup(async entry => { await gate.promise; appendReplacement(review, entry) })
    await review.reviewRegenerate()
    await review.reviewRate('bad')
    expect(review.reviewCurrent.value).toBeUndefined()
    gate.resolve()
    await settled()
    expect(review.reviewPending.value.map(entry => entry.variant.id)).toEqual(['replacement'])
    expect(review.reviewCurrent.value).toBeUndefined()
    review.closeReview()
    expect(review.reviewOpen.value).toBe(false)
    review.openReview()
    expect(review.reviewCurrent.value?.variant.id).toBe('replacement')
  })
  test('continues the normal flow after the last image is sent to regenerate', async () => {
    const gate = deferred()
    const review = setup(async entry => { await gate.promise; appendReplacement(review, entry) })
    await review.reviewInline('one', '1:1', 'old', 'good')
    await review.reviewRegenerate()
    expect(review.reviewCurrent.value).toBeUndefined()
    expect(review.reviewPending.value).toHaveLength(0)
    gate.resolve()
    await settled()
    expect(review.reviewPending.value).toHaveLength(1)
    expect(review.reviewCurrent.value).toBeUndefined()
  })
  test('keeps a failed source rated bad and exposes the error without returning it to pending', async () => {
    const gate = deferred()
    const review = setup(() => gate.promise)
    const original = review.reviewCurrent.value!
    await review.reviewRegenerate(original)
    await review.reviewRegenerate(original)
    expect(review.reviewRegeneratingCount.value).toBe(1)
    gate.reject(new Error('Gemini no está disponible'))
    await settled()
    expect(review.reviewAvailable.value.map(entry => entry.variant.id)).toEqual(['old'])
    expect(review.reviewRegenerationError.value).toContain('Gemini no está disponible')
    review.clearRegenerationError('one', '1:1', 'new')
    expect(review.reviewRegenerationError.value).toBe('')
    expect(review.reviewCanUndo.value).toBe(true)
    expect(review.reviewRegeneratingCount.value).toBe(0)
    expect(review.reviewPending.value).toHaveLength(1)
    expect(review.concepts.value[0]!.formats[0]!.variants.find(v => v.id === 'new')!.reviewRating).toBe('bad')
  })
  test('keeps legacy excluded sources out of the queue after reloading persisted concepts', async () => {
    const review = setup()
    review.concepts.value[0]!.formats[0]!.variants[0]!.reviewExcluded = true
    review.closeReview()
    review.openReview()
    expect(review.reviewCurrent.value?.variant.id).toBe('old')
    expect(review.reviewPending.value).toHaveLength(1)
    expect(review.reviewEntries.value).toHaveLength(1)
  })
  test('does not reopen a closed review and still updates pending when regeneration completes', async () => {
    const gate = deferred()
    const review = setup(async entry => { await gate.promise; appendReplacement(review, entry) })
    await review.reviewRegenerate()
    review.closeReview()
    gate.resolve()
    await settled()
    expect(review.reviewOpen.value).toBe(false)
    expect(review.reviewCurrent.value).toBeUndefined()
    expect(review.reviewPending.value.map(entry => entry.variant.id)).toEqual(['replacement', 'old'])
  })
})

describe('review scope', () => {
  test('filters active versions without losing historical pending or ratings', async () => {
    const review = setup()
    review.setReviewScope('current')
    expect(review.reviewPending.value.map(e => e.variant.id)).toEqual(['new'])
    await review.reviewRate('good')
    expect(review.reviewPending.value).toHaveLength(0)
    expect(review.reviewTotalPending.value).toBe(1)
    review.setReviewScope('all')
    expect(review.reviewCurrent.value?.variant.id).toBe('old')
  })
  test('records actual new result IDs rather than guessing a batch from timestamps', () => {
    const review = setup()
    review.setReviewScope('latest')
    expect(review.reviewScope.value).toBe('all')
    const batch = structuredClone(JSON.parse(JSON.stringify(review.concepts.value))) as StudioConcept[]
    batch[0]!.formats[0]!.variants.unshift({ ...batch[0]!.formats[0]!.variants[0]!, id: 'batch-result' })
    review.recordReviewBatch(batch)
    review.concepts.value = batch
    review.setReviewScope('latest')
    expect(review.reviewPending.value.map(e => e.variant.id)).toEqual(['batch-result'])
    expect(review.reviewTotalPending.value).toBe(3)
  })
})

test('latest scope keeps reviewing when a disjoint generation result arrives', () => {
  const review = setup()
  function batch(id: string) {
    const result = structuredClone(JSON.parse(JSON.stringify(review.concepts.value))) as StudioConcept[]
    result[0]!.formats[0]!.variants.unshift({ ...result[0]!.formats[0]!.variants[0]!, id })
    return result
  }
  let result = batch('first-batch')
  review.recordReviewBatch(result)
  review.concepts.value = result
  review.setReviewScope('latest')
  result = batch('second-batch')
  review.recordReviewBatch(result)
  review.concepts.value = result
  expect(review.reviewCurrent.value?.variant.id).toBe('first-batch')
  expect(review.reviewAvailable.value.map(e => e.variant.id)).toEqual(['first-batch', 'second-batch'])
})

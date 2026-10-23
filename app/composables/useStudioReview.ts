import { computed, ref, type Ref } from 'vue'
import { getRequestErrorMessage } from '../utils/http-errors'
import type { StudioConcept, StudioReviewRating, StudioReviewResponse } from '../../shared/types/studio'
import { studioReviewEntries, studioReviewKey, type StudioReviewEntry } from '../utils/studio-review'

interface ReviewChange {
  key: string
  rating: StudioReviewRating
}

export function useStudioReview(
  concepts: Ref<StudioConcept[]>,
  projectSlug: Ref<string>
) {
  const reviewOpen = ref(false)
  const reviewSaving = ref(false)
  const reviewError = ref('')
  const reviewMessage = ref('')
  const deferredKeys = ref<string[]>([])
  const currentKey = ref<string | null>(null)
  const history = ref<ReviewChange[]>([])
  const confirmedRatings = new Map<string, StudioReviewRating>()
  const reviewEntries = computed(() => studioReviewEntries(concepts.value))
  const reviewPending = computed(() => reviewEntries.value.filter(entry => !entry.variant.reviewRating))
  const reviewAvailable = computed(() => reviewPending.value.filter(entry => !deferredKeys.value.includes(entry.key)))
  const reviewCurrent = computed(() => reviewAvailable.value.find(entry => entry.key === currentKey.value) || reviewAvailable.value[0])
  const reviewCanUndo = computed(() => history.value.some(change => reviewEntries.value.some(entry => entry.key === change.key)))

  // A generation response can have been serialized before a review was saved.
  function mergeReviewConcept(concept: StudioConcept): StudioConcept {
    return {
      ...concept,
      formats: concept.formats.map(format => ({
        ...format,
        variants: format.variants.map(variant => {
          const key = studioReviewKey(concept.id, format.ratio, variant.id)
          return confirmedRatings.has(key) ? { ...variant, reviewRating: confirmedRatings.get(key)! } : variant
        })
      }))
    }
  }

  function applyRating(key: string, rating: StudioReviewRating) {
    // Patch only the evaluated version, preserving selections and generation results.
    concepts.value = concepts.value.map(concept => ({
      ...concept,
      formats: concept.formats.map(format => ({
        ...format,
        variants: format.variants.map(variant => studioReviewKey(concept.id, format.ratio, variant.id) === key
          ? { ...variant, reviewRating: rating }
          : variant)
      }))
    }))
  }

  async function saveReview(entry: StudioReviewEntry, rating: StudioReviewRating, recordHistory = true) {
    if (reviewSaving.value || !projectSlug.value) return false
    const slug = projectSlug.value
    reviewSaving.value = true
    reviewError.value = ''
    reviewMessage.value = ''
    try {
      const current = reviewEntries.value.find(item => item.key === entry.key)
      if (!current) throw new Error('La imagen ya no está disponible en este proyecto.')
      const previousRating = current.variant.reviewRating ?? null
      const response = await $fetch<StudioReviewResponse>(`/api/studio/projects/${encodeURIComponent(slug)}/review`, {
        method: 'PUT',
        timeout: 15_000,
        body: { conceptId: entry.conceptId, ratio: entry.ratio, variantId: entry.variant.id, rating }
      })
      if (projectSlug.value !== slug) return false
      confirmedRatings.set(entry.key, response.rating)
      applyRating(entry.key, response.rating)
      if (recordHistory) history.value.push({ key: entry.key, rating: previousRating })
      reviewMessage.value = rating === null ? 'Evaluación retirada. La imagen vuelve a pendientes.' : 'Evaluación guardada.'
      return true
    } catch (error) {
      reviewError.value = getRequestErrorMessage(error, 'No se pudo guardar la evaluación. Intenta de nuevo.')
      return false
    } finally {
      reviewSaving.value = false
    }
  }

  function reviewInline(conceptId: string, ratio: string, variantId: string, rating: Exclude<StudioReviewRating, null>) {
    const entry = reviewEntries.value.find(item => item.key === studioReviewKey(conceptId, ratio, variantId))
    if (!entry) return
    return saveReview(entry, entry.variant.reviewRating === rating ? null : rating)
  }

  async function reviewRate(rating: Exclude<StudioReviewRating, null>) {
    const entry = reviewCurrent.value
    if (!entry) return
    if (await saveReview(entry, rating)) currentKey.value = null
  }

  async function reviewUndo() {
    if (reviewSaving.value) return
    const change = [...history.value].reverse().find(item => reviewEntries.value.some(entry => entry.key === item.key))
    const entry = reviewEntries.value.find(item => item.key === change?.key)
    if (!change || !entry) return
    if (await saveReview(entry, change.rating, false)) {
      history.value.splice(history.value.lastIndexOf(change), 1)
      deferredKeys.value = deferredKeys.value.filter(key => key !== change.key)
      currentKey.value = change.key
      reviewMessage.value = 'Última evaluación deshecha.'
    }
  }

  function reviewSkip() {
    if (reviewSaving.value || !reviewCurrent.value) return
    deferredKeys.value.push(reviewCurrent.value.key)
    currentKey.value = null
    reviewMessage.value = 'La imagen sigue pendiente para después.'
  }

  function openReview() {
    deferredKeys.value = []
    reviewError.value = ''
    reviewMessage.value = ''
    reviewOpen.value = true
  }

  function closeReview() {
    if (!reviewSaving.value) reviewOpen.value = false
  }

  return {
    reviewOpen, reviewSaving, reviewError, reviewMessage,
    reviewEntries, reviewPending, reviewAvailable, reviewCurrent, reviewCanUndo,
    reviewInline, reviewRate, reviewUndo, reviewSkip, openReview, closeReview, mergeReviewConcept
  }
}

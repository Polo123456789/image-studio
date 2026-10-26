import { computed, ref, watch, type Ref } from 'vue'
import { getRequestErrorMessage } from '../utils/http-errors'
import type { StudioConcept, StudioConfirmedReviewRatings, StudioReviewRating, StudioReviewResponse, StudioVariant } from '../../shared/types/studio'
import { studioReviewEntries, studioReviewKey, type StudioReviewEntry } from '../utils/studio-review'

interface ReviewChange {
  key: string
  rating: StudioReviewRating
}

export function useStudioReview(
  concepts: Ref<StudioConcept[]>,
  projectSlug: Ref<string>,
  regenerate?: (entry: StudioReviewEntry) => Promise<void>,
  canRegenerate: (entry: StudioReviewEntry) => boolean = () => true,
  confirmedReviewRatings: Ref<StudioConfirmedReviewRatings> = ref({})
) {
  const reviewScope = ref<'all' | 'current' | 'latest'>('all')
  const latestKeys = ref<string[]>([])
  const sessionLatestKeys = ref<string[]>([])
  const reviewOpen = ref(false)
  const reviewSaving = ref(false)
  const reviewError = ref('')
  const reviewMessage = ref('')
  const deferredKeys = ref<string[]>([])
  const currentKey = ref<string | null>(null)
  const history = ref<ReviewChange[]>([])
  const confirmedExclusions = new Set<string>()
  const regeneratingKeys = ref<string[]>([])
  const regenerationErrors = ref<Record<string, string>>({})
  const sessionActive = ref(false)
  const queueOrder = ref<string[]>([])
  const allEntries = computed(() => studioReviewEntries(concepts.value))
  // Legacy regenerations excluded unrated sources; keep them out of review totals.
  const scopeKeys = computed(() => new Set(reviewScope.value === 'latest' ? (sessionActive.value ? sessionLatestKeys.value : latestKeys.value) : concepts.value.flatMap(concept => concept.formats.map(format => studioReviewKey(concept.id, format.ratio, format.activeVariantId || '')))))
  const reviewEntries = computed(() => allEntries.value.filter(entry => (reviewScope.value === 'all' || scopeKeys.value.has(entry.key)) && (entry.variant.reviewRating
    || (!entry.variant.reviewExcluded && !regeneratingKeys.value.includes(entry.key)))))
  const reviewTotalPending = computed(() => allEntries.value.filter(entry => !entry.variant.reviewRating && !entry.variant.reviewExcluded && !regeneratingKeys.value.includes(entry.key)).length)
  const reviewPending = computed(() => reviewEntries.value.filter(entry => !entry.variant.reviewRating))
  const reviewAvailable = computed(() => sessionActive.value
    ? reviewPending.value.filter(entry => !deferredKeys.value.includes(entry.key))
      .sort((a, b) => queueOrder.value.indexOf(a.key) - queueOrder.value.indexOf(b.key))
    : [])
  const reviewCurrent = computed(() => reviewAvailable.value.find(entry => entry.key === currentKey.value) || reviewAvailable.value[0])
  const reviewCanUndo = computed(() => history.value.some(change => allEntries.value.some(entry => entry.key === change.key)))
  const reviewRegeneratingCount = computed(() => regeneratingKeys.value.length)
  const reviewRegenerationError = computed(() => Object.values(regenerationErrors.value).join(' '))
  const reviewCanRegenerate = computed(() => Boolean(regenerate && reviewCurrent.value && !reviewSaving.value && canRegenerate(reviewCurrent.value)))

  watch(reviewPending, pending => {
    if (!sessionActive.value) return
    const known = new Set(queueOrder.value)
    queueOrder.value = [...queueOrder.value, ...pending.filter(entry => !known.has(entry.key)).map(entry => entry.key)]
    if (!pending.some(entry => !deferredKeys.value.includes(entry.key))) sessionActive.value = false
  }, { flush: 'sync' })

  // A generation response can have been serialized before a review was saved.
  function mergeReviewConcept(concept: StudioConcept): StudioConcept {
    const confirmedRatings = confirmedReviewRatings.value[projectSlug.value] || {}
    return {
      ...concept,
      formats: concept.formats.map(format => ({
        ...format,
        variants: format.variants.map(variant => {
          const key = studioReviewKey(concept.id, format.ratio, variant.id)
          if (variant.reviewExcluded) confirmedExclusions.add(key)
          return {
            ...variant,
            ...(Object.hasOwn(confirmedRatings, key) ? { reviewRating: confirmedRatings[key]! } : {}),
            ...(confirmedExclusions.has(key) ? { reviewExcluded: true } : {})
          }
        })
      }))
    }
  }

  function updateVariant(key: string, patch: Partial<StudioVariant>) {
    // Patch only the evaluated version, preserving selections and generation results.
    concepts.value = concepts.value.map(concept => ({
      ...concept,
      formats: concept.formats.map(format => ({
        ...format,
        variants: format.variants.map(variant => studioReviewKey(concept.id, format.ratio, variant.id) === key
          ? { ...variant, ...patch }
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
      const current = allEntries.value.find(item => item.key === entry.key)
      if (!current) throw new Error('La imagen ya no está disponible en este proyecto.')
      const previousRating = current.variant.reviewRating ?? null
      const response = await $fetch<StudioReviewResponse>(`/api/studio/projects/${encodeURIComponent(slug)}/review`, {
        method: 'PUT',
        timeout: 15_000,
        body: { conceptId: entry.conceptId, ratio: entry.ratio, variantId: entry.variant.id, rating }
      })
      if (projectSlug.value !== slug) return false
      confirmedReviewRatings.value = {
        ...confirmedReviewRatings.value,
        [slug]: { ...confirmedReviewRatings.value[slug], [entry.key]: response.rating }
      }
      updateVariant(entry.key, { reviewRating: response.rating })
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
    const entry = allEntries.value.find(item => item.key === studioReviewKey(conceptId, ratio, variantId))
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
    const change = [...history.value].reverse().find(item => allEntries.value.some(entry => entry.key === item.key))
    const entry = allEntries.value.find(item => item.key === change?.key)
    if (!change || !entry) return
    if (await saveReview(entry, change.rating, false)) {
      history.value.splice(history.value.lastIndexOf(change), 1)
      deferredKeys.value = deferredKeys.value.filter(key => key !== change.key)
      if (!queueOrder.value.includes(change.key)) queueOrder.value.push(change.key)
      sessionActive.value = reviewPending.value.some(item => !deferredKeys.value.includes(item.key))
      currentKey.value = change.key
      reviewMessage.value = 'Última evaluación deshecha.'
    }
  }

  function reviewSkip() {
    if (reviewSaving.value || !reviewCurrent.value) return
    deferredKeys.value.push(reviewCurrent.value.key)
    currentKey.value = null
    if (!reviewAvailable.value.length) sessionActive.value = false
    reviewMessage.value = 'La imagen sigue pendiente para después.'
  }

  function recordReviewBatch(batch: StudioConcept[]) {
    const existing = new Set(allEntries.value.map(entry => entry.key))
    const added = studioReviewEntries(batch).filter(entry => !existing.has(entry.key)).map(entry => entry.key)
    if (added.length) {
      if (sessionActive.value && reviewScope.value === 'latest') sessionLatestKeys.value = [...sessionLatestKeys.value, ...added]
      latestKeys.value = added
    }
  }
  function setReviewScope(scope: 'all' | 'current' | 'latest') {
    if (reviewSaving.value || (scope === 'latest' && !latestKeys.value.length)) return
    reviewScope.value = scope
    openReview()
  }
  const reviewHasLatestBatch = computed(() => latestKeys.value.length > 0)

  function openReview() {
    sessionLatestKeys.value = [...latestKeys.value]
    deferredKeys.value = []
    reviewError.value = ''
    reviewMessage.value = ''
    queueOrder.value = reviewPending.value.map(entry => entry.key)
    sessionActive.value = Boolean(queueOrder.value.length)
    reviewOpen.value = true
  }

  function closeReview() {
    if (!reviewSaving.value) {
      sessionActive.value = false
      reviewOpen.value = false
    }
  }

  function clearRegenerationError(conceptId: string, ratio: string, variantId: string) {
    const key = studioReviewKey(conceptId, ratio, variantId)
    regenerationErrors.value = Object.fromEntries(Object.entries(regenerationErrors.value).filter(([entryKey]) => entryKey !== key))
  }

  async function reviewRegenerate(entry = reviewCurrent.value) {
    if (!entry || !regenerate || reviewSaving.value || regeneratingKeys.value.includes(entry.key) || !canRegenerate(entry)) return
    const slug = projectSlug.value
    if (!await saveReview(entry, 'bad')) return
    regenerationErrors.value = Object.fromEntries(Object.entries(regenerationErrors.value).filter(([key]) => key !== entry.key))
    queueOrder.value = queueOrder.value.filter(key => key !== entry.key)
    currentKey.value = null
    regeneratingKeys.value = [...regeneratingKeys.value, entry.key]
    reviewMessage.value = 'Regenerando en segundo plano. Puedes seguir revisando.'
    void regenerate(entry).then(() => {
      if (projectSlug.value !== slug) return
      reviewMessage.value = sessionActive.value ? 'Nueva versión añadida al final de la cola.' : 'Nueva versión lista en pendientes.'
    }).catch(error => {
      if (projectSlug.value !== slug) return
      regenerationErrors.value = {
        ...regenerationErrors.value,
        [entry.key]: `${entry.conceptTitle} (${entry.ratio}): ${getRequestErrorMessage(error, 'No se pudo regenerar. La imagen conserva la evaluación mala.')}`
      }
    }).finally(() => {
      regeneratingKeys.value = regeneratingKeys.value.filter(key => key !== entry.key)
    })
  }

  function reviewRegenerateInline(conceptId: string, ratio: string, variantId: string) {
    const entry = allEntries.value.find(entry => entry.key === studioReviewKey(conceptId, ratio, variantId))
    if (entry) reviewRegenerate(entry)
  }

  return {
    reviewTotalPending, reviewScope, reviewHasLatestBatch, setReviewScope, recordReviewBatch,
    reviewOpen, reviewSaving, reviewError, reviewMessage,
    clearRegenerationError, reviewRegeneratingCount, reviewRegenerationError, reviewCanRegenerate, reviewRegenerate, reviewRegenerateInline,
    reviewEntries, reviewPending, reviewAvailable, reviewCurrent, reviewCanUndo,
    reviewInline, reviewRate, reviewUndo, reviewSkip, openReview, closeReview, mergeReviewConcept
  }
}

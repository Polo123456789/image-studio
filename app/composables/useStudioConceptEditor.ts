import type {
  StudioConcept,
  StudioConceptFormat,
  StudioConceptResponse,
  StudioProjectResponse,
  StudioVariant
} from '../../shared/types/studio'

interface ConceptSelectionOptions {
  persist?: boolean
}

export async function useStudioConceptEditor() {
  const route = useRoute()
  const router = useRouter()
  const { projectSlug, brief, concepts, isGeneratingConcepts, generationMessage, setProject } = useStudioSession()

  const pending = ref(isGeneratingConcepts.value && !concepts.value.length)
  const initialLoadError = ref('')
  const loadingPreviewId = ref<string | null>(null)
  const loadingFinalId = ref<string | null>(null)
  const promptDrafts = ref<Record<string, string>>({})
  const promptModalConceptId = ref<string | null>(null)
  const modalPromptDraft = ref('')
  const moreConceptCount = ref(1)
  const loadingMoreConcepts = ref(false)
  const loadingExport = ref(false)
  const extraConceptCounts = [1, 2, 3, 4]
  const focusedConceptId = ref<string | null>(null)
  const routeParamSlug = computed(() => typeof route.params.slug === 'string' ? route.params.slug : '')
  const routeProjectSlug = computed(() => routeParamSlug.value || projectSlug.value)

  if (!routeProjectSlug.value) {
    await router.replace('/studio')
  }

  if (routeParamSlug.value) {
    const response = await $fetch<StudioProjectResponse>(`/api/studio/projects/${routeParamSlug.value}`)

    setProject(response.project)
  }

  if (concepts.value.length) {
    isGeneratingConcepts.value = false
    generationMessage.value = ''
  }

  void ensureInitialConcepts()
  syncPromptDrafts(concepts.value)

  watch(concepts, (nextConcepts) => {
    syncPromptDrafts(nextConcepts)
  }, { deep: true })

  watch(() => [route.query.concept, route.query.ratio, route.query.variant], async () => {
    await applyLibraryFocusFromRoute()
  }, { immediate: true })

  const hasExportableConcepts = computed(() => concepts.value.some((concept) => {
    if (!concept.approvedAt) {
      return false
    }

    return concept.formats.length > 0 && concept.formats.every((format) => {
      const variant = activeVariantForFormat(format)

      return variant?.mode === 'final' && Boolean(variant.imageUrl)
    })
  }))

  const promptModalConcept = computed(() => {
    return concepts.value.find((concept) => concept.id === promptModalConceptId.value) || null
  })

  const canEditPromptInModal = computed(() => {
    if (!promptModalConcept.value) {
      return false
    }

    const format = selectedFormat(promptModalConcept.value)

    return Boolean(format && (format.isPreviewSource || promptModalConcept.value.approvedAt))
  })

  const promptModalDescription = computed(() => {
    if (!promptModalConcept.value) {
      return ''
    }

    const format = selectedFormat(promptModalConcept.value)

    if (!format) {
      return ''
    }

    if (!format.isPreviewSource && !promptModalConcept.value.approvedAt) {
      return 'Este formato todavia no tiene generacion propia. El prompt se deriva del preview principal y se aplicara cuando el concepto sea aprobado.'
    }

    return 'Edita el prompt con espacio suficiente. Quedara vinculado al historial del formato activo.'
  })

  async function ensureInitialConcepts() {
    if (concepts.value.length || !brief.value.projectName || !routeProjectSlug.value) {
      return
    }

    pending.value = true
    initialLoadError.value = ''
    isGeneratingConcepts.value = true
    generationMessage.value = 'Gemini esta redactando conceptos base para este brief.'

    try {
      generationMessage.value = 'Generando conceptos y preparando el primer preview con Imagen...'
      const response = await $fetch<StudioConceptResponse>('/api/studio/concepts', {
        method: 'POST',
        body: {
          projectSlug: routeProjectSlug.value,
          brief: brief.value
        }
      })

      concepts.value = response.concepts
      generationMessage.value = ''
      isGeneratingConcepts.value = false
    }
    catch {
      initialLoadError.value = 'No pudimos generar los conceptos iniciales. Revisa la configuracion de Gemini e intentalo de nuevo.'
      generationMessage.value = ''
      isGeneratingConcepts.value = false
    }
    finally {
      pending.value = false
    }
  }

  function syncPromptDrafts(nextConcepts: StudioConcept[]) {
    const drafts = { ...promptDrafts.value }

    nextConcepts.forEach((concept) => {
      const format = selectedFormat(concept)

      if (!drafts[concept.id]) {
        drafts[concept.id] = format?.promptDraft || ''
      }
    })

    promptDrafts.value = drafts
  }

  async function applyLibraryFocusFromRoute() {
    const conceptId = typeof route.query.concept === 'string' ? route.query.concept : ''
    const ratio = typeof route.query.ratio === 'string' ? route.query.ratio : ''
    const variantId = typeof route.query.variant === 'string' ? route.query.variant : ''

    if (!conceptId) {
      focusedConceptId.value = null
      return
    }

    const concept = concepts.value.find((item) => item.id === conceptId)

    if (!concept) {
      return
    }

    focusedConceptId.value = conceptId

    if (ratio && concept.formats.some((format) => format.ratio === ratio)) {
      selectRatio(conceptId, ratio, { persist: false })
    }

    if (ratio && variantId) {
      const format = concept.formats.find((item) => item.ratio === ratio)

      if (format?.variants.some((variant) => variant.id === variantId)) {
        selectVariant(conceptId, ratio, variantId, { persist: false })
      }
    }

    await nextTick()
    document.getElementById(`concept-${conceptId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function selectedFormat(concept: StudioConcept): StudioConceptFormat | undefined {
    return concept.formats.find((format) => format.ratio === concept.selectedRatio)
  }

  function activeVariant(concept: StudioConcept): StudioVariant | undefined {
    const format = selectedFormat(concept)

    return format?.variants.find((variant) => variant.id === format.activeVariantId)
  }

  function activeVariantForFormat(format: StudioConceptFormat): StudioVariant | undefined {
    return format.variants.find((variant) => variant.id === format.activeVariantId)
  }

  function activeVariantsByRatio(concept: StudioConcept) {
    return Object.fromEntries(concept.formats.map((format) => [format.ratio, activeVariantForFormat(format)]))
  }

  function updateConcept(conceptId: string, updater: (concept: StudioConcept) => StudioConcept) {
    concepts.value = concepts.value.map((concept) => concept.id === conceptId ? updater(concept) : concept)
  }

  function selectRatio(conceptId: string, ratio: string, options: ConceptSelectionOptions = {}) {
    updateConcept(conceptId, (concept) => {
      const format = concept.formats.find((item) => item.ratio === ratio)

      promptDrafts.value[concept.id] = format?.promptDraft || ''

      return {
        ...concept,
        selectedRatio: ratio
      }
    })

    if (options.persist !== false) {
      void persistConcepts()
    }
  }

  function cycleRatio(conceptId: string) {
    const concept = concepts.value.find((item) => item.id === conceptId)

    if (!concept) {
      return
    }

    const currentIndex = concept.formats.findIndex((format) => format.ratio === concept.selectedRatio)
    const nextIndex = currentIndex === concept.formats.length - 1 ? 0 : currentIndex + 1

    selectRatio(conceptId, concept.formats[nextIndex]?.ratio || concept.selectedRatio)
  }

  function resetPrompt(conceptId: string) {
    const concept = concepts.value.find((item) => item.id === conceptId)
    const format = concept ? selectedFormat(concept) : null

    if (!concept || !format) {
      return
    }

    promptDrafts.value[conceptId] = format.promptDraft

    if (promptModalConceptId.value === conceptId) {
      modalPromptDraft.value = format.promptDraft
    }
  }

  function selectVariant(conceptId: string, ratio: string, variantId: string, options: ConceptSelectionOptions = {}) {
    updateConcept(conceptId, (concept) => ({
      ...concept,
      selectedRatio: ratio,
      formats: concept.formats.map((format) => {
        if (format.ratio !== ratio) {
          return format
        }

        const variant = format.variants.find((item) => item.id === variantId)
        promptDrafts.value[concept.id] = variant?.prompt || format.promptDraft

        return {
          ...format,
          activeVariantId: variantId
        }
      })
    }))

    if (options.persist !== false) {
      void persistConcepts()
    }
  }

  async function regenerateVariant(conceptId: string) {
    const concept = concepts.value.find((item) => item.id === conceptId)
    const format = concept ? selectedFormat(concept) : null

    if (!concept || !format || (!format.isPreviewSource && !concept.approvedAt)) {
      return
    }

    loadingPreviewId.value = conceptId

    try {
      const prompt = promptDrafts.value[conceptId]
      const response = await $fetch<{ variant: StudioVariant }>('/api/studio/regenerate-variant', {
        method: 'POST',
        body: {
          projectSlug: routeProjectSlug.value,
          concept,
          ratio: concept.selectedRatio,
          prompt,
          resolution: brief.value.resolution
        }
      })

      updateConcept(conceptId, (currentConcept) => ({
        ...currentConcept,
        formats: currentConcept.formats.map((currentFormat) => {
          if (currentFormat.ratio !== concept.selectedRatio) {
            return currentFormat
          }

          return {
            ...currentFormat,
            promptDraft: prompt,
            variants: [response.variant, ...currentFormat.variants],
            activeVariantId: response.variant.id
          }
        })
      }))

      await persistConcepts()
    }
    finally {
      loadingPreviewId.value = null
    }
  }

  async function finalizeConcept(conceptId: string) {
    const concept = concepts.value.find((item) => item.id === conceptId)

    if (!concept) {
      return
    }

    loadingFinalId.value = conceptId

    try {
      const conceptForRequest: StudioConcept = {
        ...concept,
        formats: concept.formats.map((format) => ({
          ...format,
          promptDraft: format.ratio === concept.selectedRatio ? promptDrafts.value[conceptId] : format.promptDraft
        }))
      }

      const response = await $fetch<{ approvedAt: string, formats: { ratio: string, variant: StudioVariant }[] }>('/api/studio/finalize-concept', {
        method: 'POST',
        body: {
          projectSlug: routeProjectSlug.value,
          concept: conceptForRequest,
          resolution: brief.value.resolution
        }
      })

      updateConcept(conceptId, (currentConcept) => ({
        ...currentConcept,
        approvedAt: response.approvedAt,
        formats: currentConcept.formats.map((format) => {
          const updated = response.formats.find((item) => item.ratio === format.ratio)

          if (!updated) {
            return format
          }

          return {
            ...format,
            variants: [updated.variant, ...format.variants],
            activeVariantId: updated.variant.id
          }
        })
      }))

      await persistConcepts()
    }
    finally {
      loadingFinalId.value = null
    }
  }

  function formatTimestamp(value: string) {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value))
  }

  function discardConcept(conceptId: string) {
    concepts.value = concepts.value.filter((concept) => concept.id !== conceptId)

    if (promptModalConceptId.value === conceptId) {
      closePromptModal()
    }

    delete promptDrafts.value[conceptId]

    void persistConcepts()
  }

  async function generateMoreConcepts() {
    if (!routeProjectSlug.value) {
      return
    }

    loadingMoreConcepts.value = true

    try {
      const response = await $fetch<StudioConceptResponse>('/api/studio/concepts', {
        method: 'POST',
        body: {
          projectSlug: routeProjectSlug.value,
          brief: {
            ...brief.value,
            conceptCount: moreConceptCount.value,
            conceptOffset: concepts.value.length
          }
        }
      })

      concepts.value = response.concepts
    }
    finally {
      loadingMoreConcepts.value = false
    }
  }

  async function useConceptStyleForNextGenerations(conceptId: string) {
    if (!routeProjectSlug.value) {
      return
    }

    const concept = concepts.value.find((item) => item.id === conceptId)

    if (!concept || !concept.creativeStyleId) {
      return
    }

    const nextBrief = {
      ...brief.value,
      styleGuideId: null,
      creativeStyleId: concept.creativeStyleId
    }

    const response = await $fetch<StudioProjectResponse>(`/api/studio/projects/${routeProjectSlug.value}/brief`, {
      method: 'PUT',
      body: {
        brief: nextBrief
      }
    })

    setProject(response.project)
  }

  async function exportConcepts() {
    if (!routeProjectSlug.value || loadingExport.value || !hasExportableConcepts.value) {
      return
    }

    loadingExport.value = true

    try {
      const response = await $fetch.raw(`/api/studio/projects/${routeProjectSlug.value}/export`, {
        method: 'GET',
        responseType: 'blob'
      })
      const blob = response._data

      if (!(blob instanceof Blob)) {
        throw new Error('No se pudo preparar el ZIP de exportacion.')
      }

      const objectUrl = URL.createObjectURL(blob)
      const contentDisposition = response.headers.get('content-disposition') || ''
      const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/i)
      const fileName = fileNameMatch?.[1] || 'conceptos.zip'
      const link = document.createElement('a')

      link.href = objectUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    }
    catch (error) {
      console.error(error)
      alert('No pudimos exportar las imagenes activas del studio.')
    }
    finally {
      loadingExport.value = false
    }
  }

  function openPromptModal(conceptId: string) {
    promptModalConceptId.value = conceptId
    modalPromptDraft.value = promptDrafts.value[conceptId] || ''
  }

  function closePromptModal() {
    promptModalConceptId.value = null
    modalPromptDraft.value = ''
  }

  function savePromptModal() {
    if (!promptModalConceptId.value || !canEditPromptInModal.value) {
      return
    }

    promptDrafts.value[promptModalConceptId.value] = modalPromptDraft.value

    updateConcept(promptModalConceptId.value, (concept) => ({
      ...concept,
      formats: concept.formats.map((format) => {
        if (format.ratio !== concept.selectedRatio) {
          return format
        }

        return {
          ...format,
          promptDraft: modalPromptDraft.value
        }
      })
    }))

    closePromptModal()
    void persistConcepts()
  }

  function promptPreview(conceptId: string) {
    const value = promptDrafts.value[conceptId] || ''

    if (!value) {
      return 'Sin prompt disponible.'
    }

    return value.length > 240 ? `${value.slice(0, 240)}...` : value
  }

  async function persistConcepts() {
    if (!routeProjectSlug.value) {
      return
    }

    const response = await $fetch<StudioProjectResponse>(`/api/studio/projects/${routeProjectSlug.value}/concepts`, {
      method: 'PUT',
      body: {
        concepts: concepts.value
      }
    })

    setProject(response.project)
  }

  function formatStatusLabel(concept: StudioConcept, format: StudioConceptFormat) {
    const variant = activeVariantForFormat(format)

    if (variant?.mode === 'final') {
      return 'Final'
    }

    if (format.isPreviewSource && !concept.approvedAt) {
      return 'Preview'
    }

    return 'Pendiente'
  }

  return {
    brief,
    concepts,
    generationMessage,
    pending,
    initialLoadError,
    loadingPreviewId,
    loadingFinalId,
    promptDrafts,
    promptModalConceptId,
    modalPromptDraft,
    moreConceptCount,
    loadingMoreConcepts,
    loadingExport,
    extraConceptCounts,
    routeProjectSlug,
    focusedConceptId,
    hasExportableConcepts,
    promptModalConcept,
    canEditPromptInModal,
    promptModalDescription,
    selectedFormat,
    activeVariant,
    activeVariantForFormat,
    activeVariantsByRatio,
    selectRatio,
    cycleRatio,
    resetPrompt,
    selectVariant,
    regenerateVariant,
    finalizeConcept,
    formatTimestamp,
    discardConcept,
    generateMoreConcepts,
    useConceptStyleForNextGenerations,
    exportConcepts,
    openPromptModal,
    closePromptModal,
    savePromptModal,
    promptPreview,
    persistConcepts,
    formatStatusLabel
  }
}

import type {
  StudioConcept,
  StudioConceptFormat,
  StudioConceptListMutationResponse,
  StudioConceptMutationResponse,
  StudioConceptResponse,
  StudioProjectResponse,
  StudioVariant
} from '../../shared/types/studio'

interface ConceptMutationOptions {
  persist?: boolean
}

export async function useStudioConceptEditor() {
  const route = useRoute()
  const router = useRouter()
  const { projectSlug, brief, concepts, isGeneratingConcepts, generationMessage, setProject } = useStudioSession()

  const pending = ref(isGeneratingConcepts.value && !concepts.value.length)
  const initialLoadError = ref('')
  const previewLoadingKeys = ref<Record<string, boolean>>({})
  const finalLoadingKeys = ref<Record<string, boolean>>({})
  const conceptMutationQueue = ref<Record<string, Promise<void>>>({})
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
      selectRatio(conceptId, ratio)
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

  function createFormatKey(conceptId: string, ratio: string) {
    return `${conceptId}:${ratio}`
  }

  function setLoadingKey(target: typeof previewLoadingKeys | typeof finalLoadingKeys, key: string, value: boolean) {
    target.value = value
      ? { ...target.value, [key]: true }
      : Object.fromEntries(Object.entries(target.value).filter(([entryKey]) => entryKey !== key))
  }

  function updateConcept(conceptId: string, updater: (concept: StudioConcept) => StudioConcept) {
    concepts.value = concepts.value.map((concept) => concept.id === conceptId ? updater(concept) : concept)
  }

  function replaceConcept(nextConcept: StudioConcept) {
    updateConcept(nextConcept.id, () => nextConcept)
  }

  function enqueueConceptMutation(conceptId: string, task: () => Promise<void>) {
    const currentTask = conceptMutationQueue.value[conceptId] || Promise.resolve()
    const nextTask = currentTask
      .catch(() => undefined)
      .then(task)

    conceptMutationQueue.value = {
      ...conceptMutationQueue.value,
      [conceptId]: nextTask
    }

    return nextTask.finally(() => {
      if (conceptMutationQueue.value[conceptId] !== nextTask) {
        return
      }

      conceptMutationQueue.value = Object.fromEntries(
        Object.entries(conceptMutationQueue.value).filter(([key]) => key !== conceptId)
      )
    })
  }

  function isPreviewLoading(conceptId: string, ratio: string) {
    return Boolean(previewLoadingKeys.value[createFormatKey(conceptId, ratio)])
  }

  function isFinalLoading(conceptId: string, ratio: string) {
    return Boolean(finalLoadingKeys.value[createFormatKey(conceptId, ratio)])
  }

  function selectRatio(conceptId: string, ratio: string) {
    updateConcept(conceptId, (concept) => {
      const format = concept.formats.find((item) => item.ratio === ratio)

      promptDrafts.value[concept.id] = format?.promptDraft || ''

      return {
        ...concept,
        selectedRatio: ratio
      }
    })

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

  function selectVariant(conceptId: string, ratio: string, variantId: string, options: ConceptMutationOptions = {}) {
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
      void enqueueConceptMutation(conceptId, () => persistSelectedVariant(conceptId, ratio, variantId))
    }
  }

  async function regenerateVariant(conceptId: string) {
    const concept = concepts.value.find((item) => item.id === conceptId)
    const format = concept ? selectedFormat(concept) : null

    if (!concept || !format || (!format.isPreviewSource && !concept.approvedAt)) {
      return
    }

    const loadingKey = createFormatKey(conceptId, concept.selectedRatio)

    setLoadingKey(previewLoadingKeys, loadingKey, true)

    try {
      const prompt = promptDrafts.value[conceptId]
      const response = await $fetch<StudioConceptMutationResponse>('/api/studio/regenerate-variant', {
        method: 'POST',
        body: {
          projectSlug: routeProjectSlug.value,
          concept,
          ratio: concept.selectedRatio,
          prompt,
          resolution: brief.value.resolution
        }
      })

      replaceConcept(response.concept)
    }
    finally {
      setLoadingKey(previewLoadingKeys, loadingKey, false)
    }
  }

  async function finalizeConcept(conceptId: string) {
    const concept = concepts.value.find((item) => item.id === conceptId)

    if (!concept) {
      return
    }

    const loadingKey = createFormatKey(conceptId, concept.selectedRatio)

    setLoadingKey(finalLoadingKeys, loadingKey, true)

    try {
      const conceptForRequest: StudioConcept = {
        ...concept,
        formats: concept.formats.map((format) => ({
          ...format,
          promptDraft: format.ratio === concept.selectedRatio ? (promptDrafts.value[conceptId] ?? format.promptDraft) : format.promptDraft
        }))
      }

      const response = await $fetch<StudioConceptMutationResponse>('/api/studio/finalize-concept', {
        method: 'POST',
        body: {
          projectSlug: routeProjectSlug.value,
          concept: conceptForRequest,
          resolution: brief.value.resolution
        }
      })

      replaceConcept(response.concept)
    }
    finally {
      setLoadingKey(finalLoadingKeys, loadingKey, false)
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

    void enqueueConceptMutation(conceptId, () => persistDiscardedConcept(conceptId))
  }

  async function generateMoreConcepts() {
    if (!routeProjectSlug.value) {
      return
    }

    loadingMoreConcepts.value = true

    try {
      const response = await $fetch<StudioConceptResponse>(`/api/studio/projects/${routeProjectSlug.value}/concepts/append`, {
        method: 'POST',
        body: {
          count: moreConceptCount.value
        }
      })

      concepts.value = [...concepts.value, ...response.concepts]
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

    const conceptId = promptModalConceptId.value
    const concept = concepts.value.find((item) => item.id === conceptId)
    const ratio = concept?.selectedRatio

    updateConcept(conceptId, (concept) => ({
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

    if (ratio) {
      void enqueueConceptMutation(conceptId, () => persistPromptDraft(conceptId, ratio, modalPromptDraft.value))
    }
  }

  function promptPreview(conceptId: string) {
    const value = promptDrafts.value[conceptId] || ''

    if (!value) {
      return 'Sin prompt disponible.'
    }

    return value.length > 240 ? `${value.slice(0, 240)}...` : value
  }

  async function persistSelectedVariant(conceptId: string, ratio: string, activeVariantId: string) {
    if (!routeProjectSlug.value) {
      return
    }

    await $fetch<{ ok: true }>(`/api/studio/projects/${routeProjectSlug.value}/concepts/select-variant`, {
      method: 'PUT',
      body: {
        conceptId,
        ratio,
        activeVariantId
      }
    })

  }

  async function persistPromptDraft(conceptId: string, ratio: string, promptDraft: string) {
    if (!routeProjectSlug.value) {
      return
    }

    const response = await $fetch<StudioConceptMutationResponse>(`/api/studio/projects/${routeProjectSlug.value}/concepts/prompt`, {
      method: 'PUT',
      body: {
        conceptId,
        ratio,
        promptDraft
      }
    })

    replaceConcept(response.concept)
  }

  async function persistDiscardedConcept(conceptId: string) {
    if (!routeProjectSlug.value) {
      return
    }

    const response = await $fetch<StudioConceptListMutationResponse>(`/api/studio/projects/${routeProjectSlug.value}/concepts/discard`, {
      method: 'PUT',
      body: {
        conceptId
      }
    })

    concepts.value = response.concepts
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
    isPreviewLoading,
    isFinalLoading,
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
    formatStatusLabel
  }
}

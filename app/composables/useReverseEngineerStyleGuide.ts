import type { BrandOption } from '../../shared/types/brands'
import type { AppSettingsResponse } from '../../shared/types/settings'
import type { ReverseEngineeredStyleGuideResponse, StyleGuidePayload, StyleGuideRecord, StyleGuidesResponse } from '../../shared/types/style-guides'

import { getRequestErrorMessage } from '~/utils/http-errors'

interface SelectedFileItem {
  key: string
  file: File
  previewUrl: string
}

const maxFiles = 8

export async function useReverseEngineerStyleGuide() {
  const { data: styleGuideData } = await useFetch<StyleGuidesResponse>('/api/style-guides')
  const { data: settingsData } = await useFetch<AppSettingsResponse>('/api/settings')

  const brandSelection = ref('')
  const description = ref('')
  const promptDraft = ref('')
  const selectedFiles = ref<SelectedFileItem[]>([])
  const generatedContent = ref('')
  const isGenerating = ref(false)
  const isSavingGuide = ref(false)
  const generationFeedback = ref('')
  const generationFeedbackTone = ref<'success' | 'error'>('success')
  const saveFeedback = ref('')
  const saveFeedbackTone = ref<'success' | 'error'>('success')
  const isDragging = ref(false)
  const showPrompt = ref(false)
  const justCopied = ref(false)

  const saveForm = reactive({
    name: ''
  })

  const brandOptions = computed<BrandOption[]>(() => styleGuideData.value?.brands ?? [])
  const loadedPrompt = computed(() => settingsData.value?.styleGuideReverseEngineeringPrompt ?? '')
  const canGenerate = computed(() => selectedFiles.value.length > 0 && Boolean(promptDraft.value.trim()))
  const canSaveGuide = computed(() => Boolean(saveForm.name.trim() && generatedContent.value.trim()))
  const isPromptModified = computed(() => promptDraft.value.trim() !== loadedPrompt.value.trim())
  const generationFeedbackClass = computed(() => generationFeedbackTone.value === 'success' ? 'text-accent' : 'text-danger')
  const saveFeedbackClass = computed(() => saveFeedbackTone.value === 'success' ? 'text-accent' : 'text-danger')

  watch(loadedPrompt, (value) => {
    if (!promptDraft.value.trim()) {
      promptDraft.value = value
    }
  }, { immediate: true })

  onBeforeUnmount(() => {
    for (const file of selectedFiles.value) {
      URL.revokeObjectURL(file.previewUrl)
    }
  })

  function getErrorMessage(error: unknown, fallback: string) {
    return getRequestErrorMessage(error, fallback)
  }

  function formatFileSize(size: number) {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  function restorePrompt() {
    promptDraft.value = loadedPrompt.value
  }

  function clearFiles() {
    for (const file of selectedFiles.value) {
      URL.revokeObjectURL(file.previewUrl)
    }

    selectedFiles.value = []
  }

  function resetInput() {
    description.value = ''
    saveForm.name = ''
    generatedContent.value = ''
    generationFeedback.value = ''
    saveFeedback.value = ''
    restorePrompt()
    clearFiles()
  }

  function removeFile(key: string) {
    const item = selectedFiles.value.find((entry) => entry.key === key)

    if (item) {
      URL.revokeObjectURL(item.previewUrl)
    }

    selectedFiles.value = selectedFiles.value.filter((entry) => entry.key !== key)
  }

  function addFiles(files: File[]) {
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const validFiles = files.filter((file) => acceptedTypes.includes(file.type))

    if (!validFiles.length) {
      generationFeedback.value = 'Solo se aceptan imagenes JPG, PNG o WEBP.'
      generationFeedbackTone.value = 'error'
      return
    }

    const nextFiles = validFiles.slice(0, maxFiles - selectedFiles.value.length).map((file, index) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file)
    }))

    if (!nextFiles.length) {
      generationFeedback.value = `Puedes analizar hasta ${maxFiles} imagenes por tanda.`
      generationFeedbackTone.value = 'error'
      return
    }

    selectedFiles.value = [...selectedFiles.value, ...nextFiles]
    generationFeedback.value = ''
  }

  function handleFileSelection(event: Event) {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files ?? [])

    if (files.length) {
      addFiles(files)
    }

    input.value = ''
  }

  function handleDrop(event: DragEvent) {
    isDragging.value = false
    const files = Array.from(event.dataTransfer?.files ?? [])

    if (files.length) {
      addFiles(files)
    }
  }

  async function copyContent() {
    if (!generatedContent.value) {
      return
    }

    try {
      await navigator.clipboard.writeText(generatedContent.value)
      justCopied.value = true
      setTimeout(() => {
        justCopied.value = false
      }, 2000)
    } catch {
      // Clipboard not available
    }
  }

  async function generateGuide() {
    if (!canGenerate.value) {
      generationFeedback.value = 'Carga al menos una imagen y deja un prompt activo antes de analizar.'
      generationFeedbackTone.value = 'error'
      return
    }

    isGenerating.value = true
    generationFeedback.value = ''
    saveFeedback.value = ''

    try {
      const formData = new FormData()
      formData.append('description', [
        description.value.trim(),
        '',
        `Prompt maestro activo: ${promptDraft.value.trim()}`
      ].filter(Boolean).join('\n'))

      for (const item of selectedFiles.value) {
        formData.append('files', item.file)
      }

      const response = await $fetch<ReverseEngineeredStyleGuideResponse>('/api/style-guides/reverse-engineer', {
        method: 'POST',
        body: formData
      })

      generatedContent.value = response.content

      if (!saveForm.name.trim()) {
        saveForm.name = 'Guia reverse engineered'
      }

      generationFeedback.value = 'Guia generada. Revisa y guarda si te sirve.'
      generationFeedbackTone.value = 'success'
    } catch (error) {
      generationFeedback.value = getErrorMessage(error, 'No se pudo generar la guia.')
      generationFeedbackTone.value = 'error'
    } finally {
      isGenerating.value = false
    }
  }

  async function saveGuide() {
    if (!canSaveGuide.value) {
      saveFeedback.value = 'Completa nombre y contenido antes de guardar.'
      saveFeedbackTone.value = 'error'
      return
    }

    isSavingGuide.value = true
    saveFeedback.value = ''

    try {
      const payload: StyleGuidePayload = {
        name: saveForm.name,
        content: generatedContent.value,
        brandId: brandSelection.value ? Number(brandSelection.value) : null
      }

      const created = await $fetch<StyleGuideRecord>('/api/style-guides', {
        method: 'POST',
        body: payload
      })

      saveFeedback.value = `Guia guardada como "${created.name}".`
      saveFeedbackTone.value = 'success'
    } catch (error) {
      saveFeedback.value = getErrorMessage(error, 'No se pudo guardar la guia.')
      saveFeedbackTone.value = 'error'
    } finally {
      isSavingGuide.value = false
    }
  }

  return {
    maxFiles,
    brandSelection,
    description,
    promptDraft,
    selectedFiles,
    generatedContent,
    isGenerating,
    isSavingGuide,
    generationFeedback,
    saveFeedback,
    isDragging,
    showPrompt,
    justCopied,
    saveForm,
    brandOptions,
    canGenerate,
    canSaveGuide,
    isPromptModified,
    generationFeedbackClass,
    saveFeedbackClass,
    formatFileSize,
    restorePrompt,
    clearFiles,
    resetInput,
    removeFile,
    handleFileSelection,
    handleDrop,
    copyContent,
    generateGuide,
    saveGuide
  }
}

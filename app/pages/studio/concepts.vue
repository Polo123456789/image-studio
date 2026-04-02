<template>
  <div class="min-h-screen bg-bg text-text">
    <div class="mx-auto max-w-[1600px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
      <header class="mb-8 flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Conceptos</p>
          <h1 class="mt-3 font-display text-3xl text-text">
            {{ brief.projectName || 'Proyecto sin nombre' }}
          </h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-text-muted">
            Gemini Flash propone {{ brief.conceptCount }} conceptos. Cada uno usa un preview de baja calidad con Imagen 4 para validar la idea antes de generar todas las versiones finales con Gemini Flash Image 3.1.
          </p>
        </div>

        <div class="flex flex-wrap gap-2 text-sm text-text-muted">
          <span class="rounded border border-border px-3 py-1.5">{{ brief.goal }}</span>
          <span class="rounded border border-border px-3 py-1.5">{{ brief.mediaChannels.join(', ') }}</span>
        </div>
      </header>

      <div v-if="pending" class="rounded border border-border bg-surface p-6 text-sm text-text-muted">
        Generando conceptos iniciales...
      </div>

      <div v-else-if="!concepts.length" class="rounded border border-border bg-surface p-6 text-sm text-text-muted">
        No hay conceptos disponibles. Vuelve al brief y genera una nueva tanda.
      </div>

      <div v-else class="space-y-8">
        <article
          v-for="concept in concepts"
          :key="concept.id"
          class="overflow-hidden rounded-xl border border-border bg-surface"
        >
          <div class="grid lg:grid-cols-[minmax(0,1fr)_420px]">
            <div class="border-b border-border lg:border-b-0 lg:border-r">
              <div class="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
                <div class="flex items-center gap-3">
                  <span
                    class="rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em]"
                    :class="concept.approvedAt ? 'bg-accent/15 text-accent' : 'bg-[#6d5321] text-[#ffcc73]'"
                  >
                    {{ selectedFormat(concept)?.isPreviewSource && !concept.approvedAt ? 'Preview de baja calidad' : concept.approvedAt ? 'Final aprobado' : 'Formato pendiente' }}
                  </span>
                  <span class="font-mono text-sm text-text-muted">{{ concept.selectedRatio }}</span>
                </div>

                <button
                  type="button"
                  class="text-sm text-text-muted transition hover:text-text"
                  @click="cycleRatio(concept.id)"
                >
                  Siguiente formato
                </button>
              </div>

              <div class="bg-[#121516] px-4 py-5 sm:px-5 sm:py-6">
                <div class="overflow-hidden rounded-lg border border-border bg-black/20">
                  <img
                    :src="activeVariant(concept)?.imageUrl"
                    :alt="`${concept.title} ${concept.selectedRatio}`"
                    class="aspect-[4/3] w-full object-cover"
                  >
                </div>

                <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <button
                    v-for="format in concept.formats"
                    :key="format.ratio"
                    type="button"
                    class="rounded border p-2 text-left transition"
                    :class="format.ratio === concept.selectedRatio ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:border-accent/40'"
                    @click="selectRatio(concept.id, format.ratio)"
                  >
                    <div class="overflow-hidden rounded border border-border bg-bg">
                      <img
                        v-if="activeVariantForFormat(format)?.imageUrl"
                        :src="activeVariantForFormat(format)?.imageUrl"
                        :alt="`${concept.title} ${format.ratio}`"
                        class="aspect-square w-full object-cover"
                      >
                      <div v-else class="flex aspect-square items-center justify-center bg-bg px-3 text-center text-xs leading-5 text-text-muted">
                        Se generara al aprobar el concepto
                      </div>
                    </div>
                    <div class="mt-2 flex items-center justify-between text-xs">
                      <span class="font-mono text-text">{{ format.ratio }}</span>
                      <span class="text-text-muted">{{ formatStatusLabel(concept, format) }}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div class="flex h-full flex-col">
              <div class="border-b border-border px-5 py-5">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <h2 class="text-2xl font-medium text-text">{{ concept.title }}</h2>
                    <p class="mt-2 text-sm leading-6 text-text-muted">{{ concept.subtitle }}</p>
                    <p class="mt-3 text-sm leading-6 text-text-muted/80">{{ concept.rationale }}</p>
                  </div>

                  <button
                    type="button"
                    class="shrink-0 text-sm text-text-muted transition hover:text-danger"
                    @click="discardConcept(concept.id)"
                  >
                    Descartar
                  </button>
                </div>
              </div>

              <div class="space-y-6 px-5 py-5">
                <section class="rounded border border-[#7a5b22] bg-[#2a2118] p-4 text-sm text-[#f2d8aa]" v-if="!concept.approvedAt">
                  <p class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ffcc73]">
                    {{ selectedFormat(concept)?.isPreviewSource ? 'Preview economico' : 'Formato final pendiente' }}
                  </p>
                  <p class="mt-2 leading-6">
                    <template v-if="selectedFormat(concept)?.isPreviewSource">
                      Esta imagen es solo una referencia rapida y barata para validar la idea. Si la apruebas, generamos todas las relaciones de aspecto en alta calidad con Gemini Flash Image 3.1.
                    </template>
                    <template v-else>
                      Este formato no tiene preview independiente. Se generara directamente en alta calidad cuando apruebes el preview principal del concepto.
                    </template>
                  </p>
                  <button
                    type="button"
                    class="mt-4 w-full rounded bg-[#ff8a00] px-4 py-3 text-base font-medium text-white transition hover:opacity-90"
                    :disabled="loadingFinalId === concept.id"
                    @click="finalizeConcept(concept.id)"
                  >
                    {{ loadingFinalId === concept.id ? 'Generando versiones finales...' : 'Aprobar y generar todos los formatos HD' }}
                  </button>
                </section>

                <section v-else class="rounded border border-accent/40 bg-accent/10 p-4 text-sm text-text">
                  <p class="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                    Concepto aprobado
                  </p>
                  <p class="mt-2 leading-6 text-text-muted">
                    Este concepto ya paso a generacion final. Puedes seguir revisando formatos o regenerar previews por separado si quieres explorar otra direccion.
                  </p>
                </section>

                <section class="space-y-3">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-sm font-medium text-text">Prompt del formato {{ concept.selectedRatio }}</p>
                      <p class="mt-1 text-sm text-text-muted">
                        {{ selectedFormat(concept)?.isPreviewSource || concept.approvedAt
                          ? 'El historial de variantes siempre queda vinculado al prompt usado en ese formato.'
                          : 'Este formato heredara su composicion al aprobar el preview principal.' }}
                      </p>
                    </div>

                    <button
                      type="button"
                      class="text-sm text-text-muted transition hover:text-text"
                      @click="openPromptModal(concept.id)"
                    >
                      Editar en modal
                    </button>
                  </div>

                  <div class="rounded border border-border bg-bg px-4 py-3 text-sm leading-6 text-text-muted">
                    {{ promptPreview(concept.id) }}
                  </div>

                  <div class="flex flex-col gap-3 sm:flex-row">
                    <AppButton
                      type="button"
                      :disabled="loadingPreviewId === concept.id || !selectedFormat(concept)?.isPreviewSource"
                      @click="regeneratePreview(concept.id)"
                    >
                      {{ loadingPreviewId === concept.id ? 'Regenerando preview...' : `Regenerar preview ${concept.selectedRatio}` }}
                    </AppButton>

                    <button
                      type="button"
                      class="rounded border border-border px-4 py-2.5 text-sm text-text-muted transition hover:border-accent hover:text-text"
                      @click="resetPrompt(concept.id)"
                      :disabled="!selectedFormat(concept)?.isPreviewSource && !concept.approvedAt"
                    >
                      Restaurar prompt base
                    </button>
                  </div>
                </section>

                <section class="space-y-3 border-t border-border pt-5">
                  <div>
                    <p class="text-sm font-medium text-text">Historial del formato {{ concept.selectedRatio }}</p>
                    <p class="mt-1 text-sm text-text-muted">
                      Cada regeneracion queda asociada al prompt exacto de la variante.
                    </p>
                  </div>

                  <div class="space-y-2">
                    <button
                      v-for="variant in selectedFormat(concept)?.variants"
                      :key="variant.id"
                      type="button"
                      class="w-full rounded border px-3 py-3 text-left transition"
                      :class="variant.id === selectedFormat(concept)?.activeVariantId ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/40'"
                      @click="selectVariant(concept.id, concept.selectedRatio, variant.id)"
                    >
                      <div class="flex items-center justify-between gap-3">
                        <div>
                          <p class="text-sm text-text">{{ variant.label }}</p>
                          <p class="mt-1 text-xs text-text-muted">
                            {{ formatTimestamp(variant.createdAt) }}
                          </p>
                        </div>
                        <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
                          {{ variant.mode === 'final' ? 'Final' : 'Preview' }}
                        </span>
                      </div>
                    </button>
                    <div
                      v-if="!selectedFormat(concept)?.variants.length"
                      class="rounded border border-dashed border-border px-3 py-4 text-sm text-text-muted"
                    >
                      Aun no hay variantes para este formato. Se generara cuando apruebes el preview principal.
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </article>

        <section class="rounded-xl border border-dashed border-border bg-surface px-6 py-10">
          <div class="mx-auto max-w-2xl text-center">
            <h2 class="text-3xl font-medium text-text">¿Necesitas más opciones?</h2>
            <p class="mt-4 text-base leading-7 text-text-muted">
              Genera conceptos adicionales usando la misma informacion del brief original. Esto no modifica lo que ya aprobaste o descartaste.
            </p>

            <div class="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <div class="flex items-center gap-3 rounded border border-border bg-bg px-4 py-3">
                <span class="text-sm text-text-muted">Cantidad:</span>
                <select
                  v-model="moreConceptCount"
                  class="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none"
                >
                  <option v-for="count in extraConceptCounts" :key="count" :value="count">
                    {{ count }}
                  </option>
                </select>
              </div>

              <AppButton
                type="button"
                :disabled="loadingMoreConcepts"
                @click="generateMoreConcepts"
              >
                {{ loadingMoreConcepts ? 'Generando...' : 'Generar mas conceptos' }}
              </AppButton>
            </div>
          </div>
        </section>
      </div>

      <div
        v-if="promptModalConceptId"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
      >
        <div class="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div class="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div>
              <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">Editor de prompt</p>
              <h2 class="mt-2 text-2xl font-medium text-text">
                {{ promptModalConcept?.title }} · {{ promptModalConcept?.selectedRatio }}
              </h2>
              <p class="mt-2 text-sm leading-6 text-text-muted">
                {{ promptModalDescription }}
              </p>
            </div>

            <button
              type="button"
              class="text-sm text-text-muted transition hover:text-text"
              @click="closePromptModal"
            >
              Cerrar
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-5">
            <AppTextarea
              v-model="modalPromptDraft"
              :rows="18"
              :disabled="Boolean(promptModalConcept && !selectedFormat(promptModalConcept)?.isPreviewSource && !promptModalConcept.approvedAt)"
              placeholder="Describe composicion, texto, tono y montaje."
            />
          </div>

          <div class="flex flex-col gap-3 border-t border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              class="text-sm text-text-muted transition hover:text-text"
              :disabled="!promptModalConcept"
              @click="resetPrompt(promptModalConceptId || '')"
            >
              Restaurar prompt base
            </button>

            <div class="flex gap-3">
              <button
                type="button"
                class="rounded border border-border px-4 py-2.5 text-sm text-text-muted transition hover:border-accent hover:text-text"
                @click="closePromptModal"
              >
                Cancelar
              </button>

              <AppButton
                type="button"
                :disabled="!canEditPromptInModal"
                @click="savePromptModal"
              >
                Guardar prompt
              </AppButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppButton from '~/components/base/AppButton.vue'
import AppTextarea from '~/components/base/AppTextarea.vue'
import type { StudioConcept, StudioConceptFormat, StudioConceptResponse, StudioVariant } from '../../../shared/types/studio'

const router = useRouter()
const { brief, concepts } = useStudioSession()

const pending = ref(false)
const loadingPreviewId = ref<string | null>(null)
const loadingFinalId = ref<string | null>(null)
const promptDrafts = ref<Record<string, string>>({})
const promptModalConceptId = ref<string | null>(null)
const modalPromptDraft = ref('')
const moreConceptCount = ref(1)
const loadingMoreConcepts = ref(false)
const extraConceptCounts = [1, 2, 3, 4]

if (!brief.value.projectName) {
  await router.replace('/studio')
}

if (!concepts.value.length && brief.value.projectName) {
  pending.value = true

  try {
    const response = await $fetch<StudioConceptResponse>('/api/studio/concepts', {
      method: 'POST',
      body: brief.value
    })

    concepts.value = response.concepts
  }
  finally {
    pending.value = false
  }
}

syncPromptDrafts(concepts.value)

watch(concepts, (nextConcepts) => {
  syncPromptDrafts(nextConcepts)
}, { deep: true })

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

function updateConcept(conceptId: string, updater: (concept: StudioConcept) => StudioConcept) {
  concepts.value = concepts.value.map((concept) => concept.id === conceptId ? updater(concept) : concept)
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

function selectVariant(conceptId: string, ratio: string, variantId: string) {
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
}

async function regeneratePreview(conceptId: string) {
  const concept = concepts.value.find((item) => item.id === conceptId)
  const format = concept ? selectedFormat(concept) : null

  if (!concept || !format || !format.isPreviewSource) {
    return
  }

  loadingPreviewId.value = conceptId

  try {
    const prompt = promptDrafts.value[conceptId]
    const response = await $fetch<{ variant: StudioVariant }>('/api/studio/regenerate-preview', {
      method: 'POST',
      body: {
        concept,
        ratio: concept.selectedRatio,
        prompt
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
}

async function generateMoreConcepts() {
  loadingMoreConcepts.value = true

  try {
    const response = await $fetch<StudioConceptResponse>('/api/studio/concepts', {
      method: 'POST',
      body: {
        ...brief.value,
        conceptCount: moreConceptCount.value,
        conceptOffset: concepts.value.length
      }
    })

    concepts.value = [...concepts.value, ...response.concepts]
  }
  finally {
    loadingMoreConcepts.value = false
  }
}

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
  closePromptModal()
}

function promptPreview(conceptId: string) {
  const value = promptDrafts.value[conceptId] || ''

  if (!value) {
    return 'Sin prompt disponible.'
  }

  return value.length > 240 ? `${value.slice(0, 240)}...` : value
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
</script>

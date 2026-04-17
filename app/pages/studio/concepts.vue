<template>
  <div class="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
    <div class="mx-auto max-w-[1240px]">
      <!-- Breadcrumb -->
      <nav class="mb-6 flex items-center gap-1.5 text-xs text-text-muted">
        <NuxtLink to="/studio" class="transition hover:text-text">Proyectos</NuxtLink>
        <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        <span class="text-text">{{ brief.projectName || 'Proyecto' }}</span>
      </nav>

      <!-- Tabs -->
      <div class="mb-10 flex gap-1 rounded-lg border border-border bg-surface-2/50 p-1">
        <NuxtLink
          :to="routeProjectSlug ? `/studio/${routeProjectSlug}/brief` : '/studio'"
          class="flex-1 rounded-md px-4 py-2 text-center text-sm text-text-muted transition hover:bg-surface-2 hover:text-text"
        >
          Brief
        </NuxtLink>
        <div
          class="flex-1 rounded-md bg-accent/10 px-4 py-2 text-center text-sm font-medium text-text"
        >
          Conceptos
        </div>
      </div>

      <header class="mb-8 flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Conceptos</p>
          <h1 class="mt-3 font-display text-3xl text-text">
            {{ brief.projectName || 'Proyecto sin nombre' }}
          </h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-text-muted">
            Gemini Flash propone {{ brief.conceptCount }} conceptos. Cada uno usa un preview de baja calidad con Imagen 4 para validar la idea antes de generar todas las versiones finales con Gemini Flash Image 3.1.
          </p>
          <div class="mt-4 flex flex-wrap gap-2 text-sm text-text-muted">
            <span class="rounded border border-border px-3 py-1.5 text-xs">{{ brief.goal }}</span>
            <span class="rounded border border-border px-3 py-1.5 text-xs">{{ brief.mediaChannels.join(', ') }}</span>
          </div>
        </div>

        <AppButton
          class="shrink-0"
          type="button"
          :disabled="!routeProjectSlug || loadingExport || !hasExportableConcepts"
          @click="exportConcepts"
        >
          {{ loadingExport ? 'Preparando ZIP...' : 'Exportar ZIP' }}
        </AppButton>
      </header>

      <div v-if="pending" class="rounded-lg border border-border bg-surface px-6 py-8">
        <div class="flex items-center gap-3">
          <svg class="h-5 w-5 animate-spin text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          <span class="text-sm font-medium text-text">Generando conceptos iniciales...</span>
        </div>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
          {{ generationMessage || 'Gemini esta redactando conceptos y generando el preview inicial del primer formato. Esto puede tardar un poco.' }}
        </p>
        <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div class="h-full w-1/3 animate-pulse rounded-full bg-accent"></div>
        </div>
      </div>

      <div v-else-if="initialLoadError" class="rounded-lg border border-danger/40 bg-danger/10 px-6 py-8 text-sm text-danger">
        {{ initialLoadError }}
      </div>

      <div v-else-if="!concepts.length" class="rounded-lg border border-border bg-surface px-6 py-8 text-sm text-text-muted">
        No hay conceptos disponibles. Vuelve al brief y genera una nueva tanda.
      </div>

      <div v-else class="space-y-10">
        <StudioConceptCard
          v-for="(concept, conceptIndex) in concepts"
          :key="concept.id"
          :concept="concept"
          :index="conceptIndex"
          :focused="focusedConceptId === concept.id"
          :loading-preview="loadingPreviewId === concept.id"
          :loading-final="loadingFinalId === concept.id"
          :prompt-preview="promptPreview(concept.id)"
          :selected-format="selectedFormat(concept)"
          :active-variant="activeVariant(concept)"
          :active-variant-by-ratio="activeVariantsByRatio(concept)"
          :format-status-label="formatStatusLabel"
          :format-timestamp="formatTimestamp"
          @discard="discardConcept"
          @cycle-ratio="cycleRatio"
          @select-ratio="selectRatio"
          @finalize="finalizeConcept"
          @open-prompt="openPromptModal"
          @regenerate="regenerateVariant"
          @reset-prompt="resetPrompt"
          @select-variant="selectVariant"
          @use-style="useConceptStyleForNextGenerations"
        />

        <section class="rounded-xl border border-border bg-surface px-6 py-8">
          <div class="mx-auto flex max-w-2xl flex-col items-center text-center">
            <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">Mas opciones</p>
            <p class="mt-3 text-sm leading-6 text-text-muted">
              Genera conceptos adicionales con el mismo brief. No modifica lo que ya aprobaste.
            </p>

            <div v-if="brief.creativeStyleId" class="mt-3 inline-flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-3 py-1.5">
              <span class="font-mono text-[10px] uppercase tracking-[0.15em] text-accent">Estilo fijado</span>
              <span class="text-xs text-text-muted">Las siguientes tandas usaran el estilo seleccionado.</span>
            </div>
            <p v-else class="mt-3 text-xs leading-5 text-text-muted">
              Sin estilo fijo: Gemini elegira el mejor estilo para cada concepto usando la biblioteca activa.
            </p>

            <div class="mt-5 flex items-center gap-3">
              <AppSelect v-model="moreConceptCountValue" class="w-20">
                <option v-for="count in extraConceptCounts" :key="count" :value="String(count)">
                  {{ count }}
                </option>
              </AppSelect>

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

      <StudioConceptPromptModal
        :open="Boolean(promptModalConceptId)"
        :concept="promptModalConcept"
        :draft="modalPromptDraft"
        :description="promptModalDescription"
        :can-edit="canEditPromptInModal"
        @update:draft="modalPromptDraft = $event"
        @close="closePromptModal"
        @reset="resetPrompt(promptModalConceptId || '')"
        @save="savePromptModal"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import AppButton from '~/components/base/AppButton.vue'
import AppSelect from '~/components/base/AppSelect.vue'
import StudioConceptCard from '~/components/studio/StudioConceptCard.vue'
import StudioConceptPromptModal from '~/components/studio/StudioConceptPromptModal.vue'

const {
  brief,
  concepts,
  generationMessage,
  pending,
  initialLoadError,
  loadingPreviewId,
  loadingFinalId,
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
  activeVariantsByRatio,
  formatStatusLabel
} = await useStudioConceptEditor()

const moreConceptCountValue = computed<string>({
  get() {
    return String(moreConceptCount.value)
  },
  set(value: string) {
    moreConceptCount.value = Number(value)
  }
})
</script>

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
        <article
          v-for="(concept, conceptIndex) in concepts"
          :key="concept.id"
          :id="`concept-${concept.id}`"
          class="overflow-hidden rounded-xl border border-border bg-surface"
          :class="focusedConceptId === concept.id ? 'ring-1 ring-accent/50' : ''"
        >
          <!-- Concept header bar -->
          <div class="flex items-center justify-between border-b border-border bg-surface-2/50 px-5 py-3">
            <div class="flex items-center gap-3">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 font-mono text-xs font-medium text-accent">
                {{ conceptIndex + 1 }}
              </span>
              <h2 class="text-base font-medium text-text">{{ concept.title }}</h2>
            </div>

            <button
              type="button"
              class="rounded border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger transition hover:border-danger hover:bg-danger/20"
              @click="discardConcept(concept.id)"
            >
              Descartar concepto
            </button>
          </div>

          <div class="grid lg:grid-cols-[minmax(0,1fr)_400px]">
            <div class="border-b border-border lg:border-b-0 lg:border-r">
              <div class="flex items-center justify-between border-b border-border px-5 py-2.5">
                <div class="flex items-center gap-3">
                  <span
                    class="rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em]"
                    :class="concept.approvedAt ? 'bg-accent/15 text-accent' : selectedFormat(concept)?.isPreviewSource ? 'bg-[#6d5321]/60 text-[#ffcc73]' : 'bg-surface-2 text-text-muted'"
                  >
                    {{ selectedFormat(concept)?.isPreviewSource && !concept.approvedAt ? 'Preview' : concept.approvedAt ? 'Final' : 'Pendiente' }}
                  </span>
                  <span class="font-mono text-sm text-text-muted">{{ concept.selectedRatio }}</span>
                </div>

                <button
                  type="button"
                  class="font-mono text-xs text-text-muted transition hover:text-accent"
                  @click="cycleRatio(concept.id)"
                >
                  Siguiente &rarr;
                </button>
              </div>

              <div class="bg-[#0a0a0a] px-5 py-6">
                <div class="mx-auto flex max-h-[520px] items-center justify-center overflow-hidden rounded-lg border border-white/[0.06]">
                  <img
                    v-if="activeVariant(concept)?.imageUrl"
                    :src="activeVariant(concept)?.imageUrl"
                    :alt="`${concept.title} ${concept.selectedRatio}`"
                    class="max-h-[520px] w-full object-contain"
                  >
                  <div v-else class="flex h-64 w-full items-center justify-center text-sm text-text-muted">
                    Sin preview disponible
                  </div>
                </div>
              </div>

              <!-- Format thumbnails -->
              <div class="border-t border-border bg-surface px-5 py-4">
                <div class="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  <button
                    v-for="format in concept.formats"
                    :key="format.ratio"
                    type="button"
                    class="group rounded-lg border p-2 text-left transition"
                    :class="format.ratio === concept.selectedRatio ? 'border-accent bg-accent/8' : 'border-border hover:border-accent/30'"
                    @click="selectRatio(concept.id, format.ratio)"
                  >
                    <div class="overflow-hidden rounded border border-white/[0.04] bg-[#0a0a0a]">
                      <img
                        v-if="activeVariantForFormat(format)?.imageUrl"
                        :src="activeVariantForFormat(format)?.imageUrl"
                        :alt="`${concept.title} ${format.ratio}`"
                        class="aspect-[4/3] w-full object-cover"
                      >
                      <div v-else class="flex aspect-[4/3] items-center justify-center px-3 text-center text-[11px] leading-4 text-text-muted/60">
                        Pendiente
                      </div>
                    </div>
                    <div class="mt-1.5 flex items-center justify-between px-0.5">
                      <span class="font-mono text-[11px]" :class="format.ratio === concept.selectedRatio ? 'text-accent' : 'text-text'">{{ format.ratio }}</span>
                      <span
                        class="text-[10px]"
                        :class="activeVariantForFormat(format)?.mode === 'final' ? 'text-accent' : 'text-text-muted/60'"
                      >
                        {{ formatStatusLabel(concept, format) }}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div class="flex h-full flex-col">
              <!-- Concept info -->
              <div class="border-b border-border px-5 py-5">
                <p class="text-sm leading-6 text-text-muted">{{ concept.subtitle }}</p>
                <p class="mt-2 text-sm leading-6 text-text-muted/70">{{ concept.rationale }}</p>
              </div>

              <div class="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                <section v-if="!concept.approvedAt" class="rounded-lg border border-[#7a5b22]/60 bg-[#2a2118]/80 p-4 text-sm text-[#f2d8aa]">
                  <p class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ffcc73]">
                    {{ selectedFormat(concept)?.isPreviewSource ? 'Preview economico' : 'Formato final pendiente' }}
                  </p>
                  <p class="mt-2 leading-6 text-[#f2d8aa]/80">
                    <template v-if="selectedFormat(concept)?.isPreviewSource">
                      Referencia rapida para validar la idea. Si apruebas, generamos todos los formatos en HD.
                    </template>
                    <template v-else>
                      Se generara en alta calidad al aprobar el preview principal.
                    </template>
                  </p>
                  <button
                    type="button"
                    class="mt-3 w-full rounded-lg bg-[#ff8a00] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                    :disabled="loadingFinalId === concept.id"
                    @click="finalizeConcept(concept.id)"
                  >
                    {{ loadingFinalId === concept.id ? 'Generando versiones finales...' : 'Aprobar y generar HD' }}
                  </button>
                </section>

                <section v-else class="rounded-lg border border-accent/30 bg-accent/8 p-4 text-sm">
                  <p class="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Concepto aprobado</p>
                  <p class="mt-2 leading-6 text-text-muted">
                    Generacion final completada. Puedes revisar formatos o regenerar variantes.
                  </p>
                </section>

                <section class="space-y-3">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm font-medium text-text">Prompt &middot; {{ concept.selectedRatio }}</p>

                    <button
                      type="button"
                      class="rounded border border-accent/30 bg-accent/8 px-3 py-1.5 text-xs font-medium text-accent transition hover:border-accent hover:bg-accent/15"
                      @click="openPromptModal(concept.id)"
                    >
                      Editar prompt
                    </button>
                  </div>

                  <p class="text-xs text-text-muted">
                    {{ selectedFormat(concept)?.isPreviewSource || concept.approvedAt
                      ? 'Vinculado al historial de variantes del formato.'
                      : 'Se aplicara al aprobar el preview principal.' }}
                  </p>

                  <div class="rounded-lg border border-border bg-bg/80 px-4 py-3 font-mono text-xs leading-5 text-text-muted">
                    {{ promptPreview(concept.id) }}
                  </div>

                  <div class="flex flex-col gap-2 sm:flex-row">
                    <AppButton
                      type="button"
                      :disabled="loadingPreviewId === concept.id || (!selectedFormat(concept)?.isPreviewSource && !concept.approvedAt)"
                      @click="regenerateVariant(concept.id)"
                    >
                      {{ loadingPreviewId === concept.id ? 'Regenerando...' : concept.approvedAt ? 'Regenerar' : 'Regenerar preview' }}
                    </AppButton>

                    <button
                      type="button"
                      class="rounded border border-border px-4 py-2.5 text-xs text-text-muted transition hover:border-text-muted hover:text-text disabled:opacity-40"
                      @click="resetPrompt(concept.id)"
                      :disabled="!selectedFormat(concept)?.isPreviewSource && !concept.approvedAt"
                    >
                      Restaurar original
                    </button>
                  </div>
                </section>

                <section class="space-y-3 border-t border-border pt-4">
                  <p class="text-xs font-medium uppercase tracking-wider text-text-muted">
                    Historial &middot; {{ concept.selectedRatio }}
                  </p>

                  <div class="space-y-1.5">
                    <button
                      v-for="variant in selectedFormat(concept)?.variants"
                      :key="variant.id"
                      type="button"
                      class="w-full rounded-lg border px-3 py-2.5 text-left transition"
                      :class="variant.id === selectedFormat(concept)?.activeVariantId ? 'border-accent/50 bg-accent/8' : 'border-border hover:border-accent/25'"
                      @click="selectVariant(concept.id, concept.selectedRatio, variant.id)"
                    >
                      <div class="flex items-center justify-between gap-3">
                        <div>
                          <p class="text-sm text-text">{{ variant.label }}</p>
                          <p class="mt-0.5 text-[11px] text-text-muted">
                            {{ formatTimestamp(variant.createdAt) }}
                          </p>
                        </div>
                        <span
                          class="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em]"
                          :class="variant.mode === 'final' ? 'bg-accent/15 text-accent' : 'text-text-muted'"
                        >
                          {{ variant.mode === 'final' ? 'Final' : 'Preview' }}
                        </span>
                      </div>
                    </button>
                    <p
                      v-if="!selectedFormat(concept)?.variants.length"
                      class="py-3 text-center text-xs text-text-muted/60"
                    >
                      Sin variantes. Se generaran al aprobar.
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </article>

        <section class="rounded-xl border border-border bg-surface px-6 py-8">
          <div class="mx-auto flex max-w-2xl flex-col items-center text-center">
            <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">Mas opciones</p>
            <p class="mt-3 text-sm leading-6 text-text-muted">
              Genera conceptos adicionales con el mismo brief. No modifica lo que ya aprobaste.
            </p>

            <div class="mt-5 flex items-center gap-3">
              <select
                v-model="moreConceptCount"
                class="rounded-lg border border-border bg-bg px-3 py-2.5 font-mono text-sm text-text outline-none transition focus:border-accent"
              >
                <option v-for="count in extraConceptCounts" :key="count" :value="count">
                  {{ count }}
                </option>
              </select>

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
  exportConcepts,
  openPromptModal,
  closePromptModal,
  savePromptModal,
  promptPreview,
  formatStatusLabel
} = await useStudioConceptEditor()
</script>

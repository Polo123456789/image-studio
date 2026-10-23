<template>
  <article
    :id="`concept-${concept.id}`"
    class="overflow-hidden rounded-xl border border-border bg-surface"
    :class="focused ? 'ring-1 ring-accent/50' : ''"
  >
    <div class="flex items-center justify-between border-b border-border bg-surface-2/50 px-5 py-3">
      <div class="flex items-center gap-3">
        <span class="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 font-mono text-xs font-medium text-accent">
          {{ index + 1 }}
        </span>
        <div class="min-w-0">
          <h2 class="truncate text-base font-medium text-text">{{ concept.title }}</h2>
          <p v-if="concept.creativeStyleName" class="mt-1 text-[11px] text-text-muted">
            Estilo: <span class="text-text">{{ concept.creativeStyleName }}</span>
          </p>
        </div>
      </div>

      <button
        type="button"
        class="rounded border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger transition hover:border-danger hover:bg-danger/20"
        :disabled="generationBusy"
        @click="$emit('discard', concept.id)"
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
              :class="selectedFormat?.generationError ? 'bg-danger/15 text-danger' : activeVariant?.mode === 'final' ? 'bg-accent/15 text-accent' : activeVariant?.mode === 'preview' ? 'bg-[#6d5321]/60 text-[#ffcc73]' : 'bg-surface-2 text-text-muted'"
            >
              {{ generationStatusLabel }}
            </span>
            <span class="font-mono text-sm text-text-muted">{{ concept.selectedRatio }}</span>
          </div>

          <button
            type="button"
            class="font-mono text-xs text-text-muted transition hover:text-accent"
            @click="$emit('cycle-ratio', concept.id)"
          >
            Siguiente &rarr;
          </button>
        </div>

        <div class="bg-[#0a0a0a] px-5 py-6">
          <div class="relative mx-auto flex max-h-[520px] items-center justify-center overflow-hidden rounded-lg border border-white/[0.06]">
            <img
              v-if="activeVariant?.imageUrl"
              :src="activeVariant.imageUrl"
              loading="lazy"
              decoding="async"
              :alt="`${concept.title} ${concept.selectedRatio}`"
              class="max-h-[520px] w-full object-contain"
            >
            <div
              v-else-if="loadingVariant"
              class="flex h-64 w-full flex-col items-center justify-center gap-3 text-sm text-text-muted"
            >
              <svg class="h-6 w-6 animate-spin text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              {{ finalizing ? 'Generando arte final 4K...' : usesPreview ? 'Generando preview 1K...' : 'Regenerando imagen...' }}
            </div>
            <div
              v-else-if="selectedFormat?.generationError"
              class="flex min-h-64 w-full flex-col items-center justify-center px-6 py-10 text-center"
            >
              <div class="flex h-11 w-11 items-center justify-center rounded-full border border-danger/40 bg-danger/10 text-danger">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
              </div>
              <p class="mt-4 text-sm font-medium text-danger">No se pudo generar esta imagen</p>
              <p class="mt-2 max-w-xl break-words text-xs leading-5 text-text-muted">
                {{ selectedFormat.generationError }}
              </p>
              <button
                type="button"
                class="mt-5 rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-xs font-medium text-danger transition hover:border-danger hover:bg-danger/20"
                :disabled="generationBusy"
                @click="$emit('regenerate', concept.id)"
              >
                {{ usesPreview ? 'Generar preview 1K' : 'Regenerar imagen' }}
              </button>
            </div>
            <div v-else class="flex h-64 w-full items-center justify-center text-sm text-text-muted">
              Arte pendiente
            </div>
            <div v-if="activeVariant?.imageUrl" class="absolute bottom-3 right-3 flex items-center gap-3 rounded-xl border border-border bg-surface/95 p-2 shadow-lg">
              <span v-if="activeVariant.reviewRating" class="pl-2 text-xs" :class="activeVariant.reviewRating === 'good' ? 'text-accent' : 'text-danger'">{{ activeVariant.reviewRating === 'good' ? 'Buena' : 'Mala' }}</span>
              <StudioReviewControls :rating="activeVariant.reviewRating" :disabled="reviewSaving" :labels="false" @rate="emit('review', concept.id, concept.selectedRatio, activeVariant!.id, $event)" />
            </div>
          </div>

          <div
            v-if="activeVariant?.imageUrl && selectedFormat?.generationError"
            class="mx-auto mt-3 flex max-w-3xl flex-col gap-3 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <p class="text-xs font-medium text-danger">El nuevo intento de generación falló</p>
              <p class="mt-1 break-words text-xs leading-5 text-text-muted">
                {{ selectedFormat.generationError }}
              </p>
            </div>
            <button
              type="button"
              class="shrink-0 rounded border border-danger/40 px-3 py-2 text-xs font-medium text-danger transition hover:border-danger hover:bg-danger/10 disabled:opacity-50"
              :disabled="generationBusy"
              @click="$emit('regenerate', concept.id)"
            >
              {{ finalizing ? 'Generando 4K...' : loadingVariant ? 'Regenerando...' : usesPreview ? 'Regenerar preview 1K' : 'Regenerar imagen' }}
            </button>
          </div>
        </div>

        <div class="border-t border-border bg-surface px-5 py-4">
          <div class="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            <button
              v-for="format in concept.formats"
              :key="format.ratio"
              type="button"
              class="group rounded-lg border p-2 text-left transition"
              :class="format.ratio === concept.selectedRatio ? 'border-accent bg-accent/8' : 'border-border hover:border-accent/30'"
              @click="$emit('ratio-selected', concept.id, format.ratio)"
            >
              <div class="overflow-hidden rounded border border-white/[0.04] bg-[#0a0a0a]">
                <img
                  v-if="activeVariantByRatio[format.ratio]?.imageUrl"
                  :src="activeVariantByRatio[format.ratio]?.imageUrl"
                  loading="lazy"
                  decoding="async"
                  :alt="`${concept.title} ${format.ratio}`"
                  class="aspect-[4/3] w-full object-cover"
                >
                <div v-else class="flex aspect-[4/3] items-center justify-center px-3 text-center text-[11px] leading-4 text-text-muted/60">
                  <span :class="format.generationError ? 'text-danger' : ''">
                    {{ format.generationError ? 'Error de generación' : 'Pendiente' }}
                  </span>
                </div>
              </div>
              <div class="mt-1.5 flex items-center justify-between px-0.5">
                <span class="font-mono text-[11px]" :class="format.ratio === concept.selectedRatio ? 'text-accent' : 'text-text'">{{ format.ratio }}</span>
                <span
                  class="text-[10px]"
                  :class="format.generationError ? 'text-danger' : activeVariantByRatio[format.ratio]?.mode === 'final' ? 'text-accent' : 'text-text-muted/60'"
                >
                  {{ formatStatusLabel(concept, format) }}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div class="flex h-full flex-col">
        <div class="border-b border-border px-5 py-5">
          <p class="text-sm leading-6 text-text-muted">{{ concept.subtitle }}</p>
          <p class="mt-2 text-sm leading-6 text-text-muted/70">{{ concept.rationale }}</p>

          <div v-if="concept.creativeStyleName" class="mt-4 rounded-lg border border-border bg-surface-2/40 px-4 py-3">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">Estilo elegido</p>
                <p class="mt-1 text-sm text-text">{{ concept.creativeStyleName }}</p>
              </div>

              <button
                v-if="concept.creativeStyleId"
                type="button"
                class="rounded border border-accent/30 bg-accent/8 px-3 py-1.5 text-xs font-medium text-accent transition hover:border-accent hover:bg-accent/15"
                @click="$emit('use-style', concept.id)"
              >
                Usar este estilo despues
              </button>
            </div>
          </div>
        </div>

        <div class="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <section v-if="hasPendingFormats" class="rounded-lg border border-[#7a5b22]/60 bg-[#2a2118]/80 p-4 text-sm text-[#f2d8aa]">
            <p class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ffcc73]">Formatos pendientes</p>
            <p class="mt-2 leading-6 text-[#f2d8aa]/80">
              {{ usesPreview ? 'Genera previews 1K de los formatos que todavia no tienen imagen. Luego aprueba cada formato para generar su final 4K.' : 'Genera en bloque los ratios que todavia no tienen un arte final activo. Los artes ya generados no se reemplazaran.' }}
            </p>
            <button
              type="button"
              class="mt-3 w-full rounded-lg bg-[#ff8a00] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              :disabled="generationBusy"
              @click="$emit('generate-pending-formats', concept.id)"
            >
              {{ loadingPendingFormats ? 'Generando formatos...' : usesPreview ? 'Generar previews pendientes' : 'Generar formatos pendientes' }}
            </button>
          </section>

          <section v-else class="rounded-lg border border-accent/30 bg-accent/8 p-4 text-sm">
            <p class="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">{{ hasPreviewFormats ? 'Previews listos' : 'Formatos completos' }}</p>
            <p class="mt-2 leading-6 text-text-muted">
              {{ hasPreviewFormats ? 'Los previews estan listos. Selecciona cada formato y apruebalo para generar su final 4K.' : 'Todos los formatos tienen un arte final activo. Puedes revisarlos o regenerar variantes.' }}
            </p>
          </section>

          <p v-if="requestError" role="alert" class="break-words text-sm text-danger">{{ requestError }}</p>

          <section v-if="usesPreview && activeVariant?.mode === 'preview'" class="space-y-3 rounded-lg border border-accent/30 bg-accent/8 p-4">
            <p class="text-sm font-medium text-text">Aprobar este formato</p>
            <label class="block text-xs text-text-muted">
              Como generar el arte final
              <select
                :value="finalizationStrategy"
                :disabled="generationBusy"
                class="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
                @change="$emit('finalization-strategy', concept.id, concept.selectedRatio, ($event.target as HTMLSelectElement).value as StudioFinalizationStrategy)"
              >
                <option value="reference">Usar preview como referencia</option>
                <option value="prompt">Repetir el mismo prompt</option>
              </select>
            </label>
            <p class="text-xs leading-5 text-text-muted">
              {{ finalizationStrategy === 'reference' ? 'Usa este preview y su prompt para conservar el diseno en 4K. El resultado puede variar.' : 'Genera otra imagen en 4K usando el mismo prompt y los assets del brief.' }}
            </p>
            <p v-if="previewNeedsRegeneration" class="text-xs leading-5 text-text-muted">
              El prompt cambio. Genera un nuevo preview antes de aprobarlo.
            </p>
            <AppButton type="button" :disabled="generationBusy || previewNeedsRegeneration" @click="$emit('finalize', concept.id)">
              {{ finalizing ? 'Generando 4K...' : 'Aprobar y generar 4K' }}
            </AppButton>
          </section>

          <section class="space-y-3">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-medium text-text">Prompt &middot; {{ concept.selectedRatio }}</p>

              <button
                type="button"
                class="rounded border border-accent/30 bg-accent/8 px-3 py-1.5 text-xs font-medium text-accent transition hover:border-accent hover:bg-accent/15 disabled:opacity-50"
                :disabled="generationBusy"
                @click="$emit('open-prompt', concept.id)"
              >
                Editar prompt
              </button>
            </div>

            <p class="text-xs text-text-muted">
              Se usara al generar o regenerar este formato.
            </p>

            <div class="rounded-lg border border-border bg-bg/80 px-4 py-3 font-mono text-xs leading-5 text-text-muted">
              {{ promptPreview }}
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <div ref="sizeControl" class="relative" @keydown.esc.stop.prevent="closeSizeMenu(true)">
                <div class="inline-flex">
                  <button
                    type="button"
                    class="rounded-l bg-accent px-4 py-2.5 text-sm font-medium text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="generationBusy || !selectedFormat"
                    @click="$emit('regenerate', concept.id)"
                  >
                    {{ regenerationLabel }}
                  </button>
                  <button
                    ref="sizeToggle"
                    type="button"
                    class="flex items-center justify-center rounded-r border-l border-bg/20 bg-accent px-3 text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Generar en otro tamaño"
                    :aria-expanded="sizeMenuOpen"
                    :aria-controls="`size-options-${concept.id}`"
                    :disabled="generationBusy || !activeVariant?.imageUrl"
                    @click="sizeMenuOpen = !sizeMenuOpen"
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="m5 8 5 5 5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
                <div
                  v-if="sizeMenuOpen"
                  :id="`size-options-${concept.id}`"
                  class="absolute left-0 top-full z-20 mt-2 w-64 rounded-lg border border-border bg-surface-2 p-1.5 shadow-lg"
                >
                  <p class="mx-2 mb-1 border-b border-border pb-2 pt-1 text-[11px] leading-4 text-text-muted">
                    Usar imagen actual como referencia
                  </p>
                  <button
                    v-for="size in availableSizes"
                    :key="size"
                    type="button"
                    class="flex w-full items-center justify-between rounded px-3 py-2.5 text-left text-sm text-text transition hover:bg-surface focus-visible:bg-surface"
                    @click="regenerateAtSize(size)"
                  >
                    <span>Generar en {{ size }}</span>
                    <span class="font-mono text-xs text-text-muted">{{ size }}</span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                class="text-xs text-text-muted transition hover:text-text disabled:opacity-40"
                :disabled="generationBusy"
                @click="$emit('reset-prompt', concept.id)"
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
                v-for="variant in selectedFormat?.variants"
                :key="variant.id"
                type="button"
                class="w-full rounded-lg border px-3 py-2.5 text-left transition"
                :class="variant.id === selectedFormat?.activeVariantId ? 'border-accent/50 bg-accent/8' : 'border-border hover:border-accent/25'"
                :disabled="generationBusy"
                @click="$emit('select-variant', concept.id, concept.selectedRatio, variant.id)"
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
                    {{ variant.mode === 'final' ? 'Arte' : usesPreview ? 'Preview 1K' : 'Preview' }}
                  </span>
                </div>
              </button>
              <p
                v-if="!selectedFormat?.variants.length"
                class="py-3 text-center text-xs text-text-muted/60"
              >
                {{ selectedFormat?.generationError ? 'La generación falló. Puedes intentarlo de nuevo.' : usesPreview ? 'Sin preview. Genera este formato en 1K.' : 'Sin variantes. Se generara al completar los formatos pendientes.' }}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { StudioConcept, StudioConceptFormat, StudioVariant, StudioFinalizationStrategy, StudioReviewRating } from '../../../shared/types/studio'

import AppButton from '~/components/base/AppButton.vue'
import StudioReviewControls from './StudioReviewControls.vue'

const emit = defineEmits<{
  review: [conceptId: string, ratio: string, variantId: string, rating: Exclude<StudioReviewRating, null>]
  discard: [conceptId: string]
  'cycle-ratio': [conceptId: string]
  'ratio-selected': [conceptId: string, ratio: string]
  'generate-pending-formats': [conceptId: string]
  'open-prompt': [conceptId: string]
  finalize: [conceptId: string]
  'finalization-strategy': [conceptId: string, ratio: string, strategy: StudioFinalizationStrategy]
  regenerate: [conceptId: string, targetSize?: '1K' | '2K' | '4K']
  'reset-prompt': [conceptId: string]
  'select-variant': [conceptId: string, ratio: string, variantId: string]
  'use-style': [conceptId: string]
}>()

const props = defineProps<{
  reviewSaving: boolean
  usesPreview: boolean
  finalizationStrategy: StudioFinalizationStrategy
  finalizing: boolean
  generationBusy: boolean
  requestError: string
  concept: StudioConcept
  index: number
  focused: boolean
  loadingVariant: boolean
  loadingPendingFormats: boolean
  promptPreview: string
  promptDraft: string
  selectedFormat: StudioConceptFormat | undefined
  activeVariant: StudioVariant | undefined
  activeVariantByRatio: Record<string, StudioVariant | undefined>
  formatStatusLabel: (concept: StudioConcept, format: StudioConceptFormat) => string
  formatTimestamp: (value: string) => string
}>()

const sizeMenuOpen = ref(false)
const sizeControl = ref<HTMLElement | null>(null)
const sizeToggle = ref<HTMLButtonElement | null>(null)
const availableSizes = computed(() => {
  const currentSize = props.activeVariant?.label.match(/\b(1K|2K|4K)\b/)?.[1]
    || (props.activeVariant?.mode === 'preview' ? '1K' : undefined)
  return (['1K', '2K', '4K'] as const).filter(size => size !== currentSize)
})

function closeSizeMenu(restoreFocus = false) {
  sizeMenuOpen.value = false
  if (restoreFocus) sizeToggle.value?.focus()
}

function regenerateAtSize(size: '1K' | '2K' | '4K') {
  if (props.generationBusy || !availableSizes.value.includes(size)) return
  closeSizeMenu(true)
  emit('regenerate', props.concept.id, size)
}

function onOutsideInteraction(event: Event) {
  if (event.target instanceof Node && !sizeControl.value?.contains(event.target)) closeSizeMenu()
}

watch(() => [props.concept.id, props.concept.selectedRatio, props.activeVariant?.id, props.generationBusy], () => closeSizeMenu())
onMounted(() => {
  document.addEventListener('pointerdown', onOutsideInteraction)
  document.addEventListener('focusin', onOutsideInteraction)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutsideInteraction)
  document.removeEventListener('focusin', onOutsideInteraction)
})

const previewNeedsRegeneration = computed(() => props.activeVariant?.mode === 'preview' && props.promptDraft !== props.activeVariant.prompt)

const hasPreviewFormats = computed(() => props.usesPreview && props.concept.formats.some(format => props.activeVariantByRatio[format.ratio]?.mode === 'preview'))

const generationStatusLabel = computed(() => {
  if (props.selectedFormat?.generationError) return 'Error'
  if (props.activeVariant?.mode === 'final') return props.usesPreview ? 'Arte final 4K' : 'Arte generado'
  if (props.activeVariant?.mode === 'preview') return props.usesPreview ? 'Preview 1K' : 'Preview'
  return 'Pendiente'
})

const regenerationLabel = computed(() => {
  if (props.finalizing) return 'Generando 4K...'
  if (props.loadingVariant) return 'Regenerando...'
  if (props.activeVariant) return 'Regenerar imagen'
  if (props.usesPreview) return 'Generar preview 1K'
  return props.selectedFormat?.generationError ? 'Reintentar generación' : 'Regenerar arte'
})

const hasPendingFormats = computed(() => props.concept.formats.some((format) => {
  const activeVariant = format.variants.find((variant) => variant.id === format.activeVariantId)

  return props.usesPreview ? !activeVariant : activeVariant?.mode !== 'final'
}))
</script>

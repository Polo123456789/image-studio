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
              :class="concept.approvedAt ? 'bg-accent/15 text-accent' : selectedFormat?.isPreviewSource ? 'bg-[#6d5321]/60 text-[#ffcc73]' : 'bg-surface-2 text-text-muted'"
            >
              {{ selectedFormat?.isPreviewSource && !concept.approvedAt ? 'Preview' : concept.approvedAt ? 'Final' : 'Pendiente' }}
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
          <div class="mx-auto flex max-h-[520px] items-center justify-center overflow-hidden rounded-lg border border-white/[0.06]">
            <img
              v-if="activeVariant?.imageUrl"
              :src="activeVariant.imageUrl"
              :alt="`${concept.title} ${concept.selectedRatio}`"
              class="max-h-[520px] w-full object-contain"
            >
            <div v-else class="flex h-64 w-full items-center justify-center text-sm text-text-muted">
              Sin preview disponible
            </div>
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
              @click="$emit('select-ratio', concept.id, format.ratio)"
            >
              <div class="overflow-hidden rounded border border-white/[0.04] bg-[#0a0a0a]">
                <img
                  v-if="activeVariantByRatio[format.ratio]?.imageUrl"
                  :src="activeVariantByRatio[format.ratio]?.imageUrl"
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
                  :class="activeVariantByRatio[format.ratio]?.mode === 'final' ? 'text-accent' : 'text-text-muted/60'"
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
          <section v-if="!concept.approvedAt" class="rounded-lg border border-[#7a5b22]/60 bg-[#2a2118]/80 p-4 text-sm text-[#f2d8aa]">
            <p class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ffcc73]">
              {{ selectedFormat?.isPreviewSource ? 'Preview economico' : 'Formato final pendiente' }}
            </p>
            <p class="mt-2 leading-6 text-[#f2d8aa]/80">
              <template v-if="selectedFormat?.isPreviewSource">
                Referencia rapida para validar la idea. Si apruebas, generamos todos los formatos en HD.
              </template>
              <template v-else>
                Se generara en alta calidad al aprobar el preview principal.
              </template>
            </p>
            <button
              type="button"
              class="mt-3 w-full rounded-lg bg-[#ff8a00] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              :disabled="loadingFinal"
              @click="$emit('finalize', concept.id)"
            >
              {{ loadingFinal ? 'Generando versiones finales...' : 'Aprobar y generar HD' }}
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
                @click="$emit('open-prompt', concept.id)"
              >
                Editar prompt
              </button>
            </div>

            <p class="text-xs text-text-muted">
              {{ selectedFormat?.isPreviewSource || concept.approvedAt
                ? 'Vinculado al historial de variantes del formato.'
                : 'Se aplicara al aprobar el preview principal.' }}
            </p>

            <div class="rounded-lg border border-border bg-bg/80 px-4 py-3 font-mono text-xs leading-5 text-text-muted">
              {{ promptPreview }}
            </div>

            <div class="flex flex-col gap-2 sm:flex-row">
              <AppButton
                type="button"
                :disabled="loadingPreview || (!selectedFormat?.isPreviewSource && !concept.approvedAt)"
                @click="$emit('regenerate', concept.id)"
              >
                {{ loadingPreview ? 'Regenerando...' : concept.approvedAt ? 'Regenerar' : 'Regenerar preview' }}
              </AppButton>

              <button
                type="button"
                class="rounded border border-border px-4 py-2.5 text-xs text-text-muted transition hover:border-text-muted hover:text-text disabled:opacity-40"
                :disabled="!selectedFormat?.isPreviewSource && !concept.approvedAt"
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
                    {{ variant.mode === 'final' ? 'Final' : 'Preview' }}
                  </span>
                </div>
              </button>
              <p
                v-if="!selectedFormat?.variants.length"
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
</template>

<script setup lang="ts">
import type { StudioConcept, StudioConceptFormat, StudioVariant } from '../../../shared/types/studio'

import AppButton from '~/components/base/AppButton.vue'

defineProps<{
  concept: StudioConcept
  index: number
  focused: boolean
  loadingPreview: boolean
  loadingFinal: boolean
  promptPreview: string
  selectedFormat: StudioConceptFormat | undefined
  activeVariant: StudioVariant | undefined
  activeVariantByRatio: Record<string, StudioVariant | undefined>
  formatStatusLabel: (concept: StudioConcept, format: StudioConceptFormat) => string
  formatTimestamp: (value: string) => string
}>()

defineEmits<{
  discard: [conceptId: string]
  'cycle-ratio': [conceptId: string]
  'select-ratio': [conceptId: string, ratio: string]
  finalize: [conceptId: string]
  'open-prompt': [conceptId: string]
  regenerate: [conceptId: string]
  'reset-prompt': [conceptId: string]
  'select-variant': [conceptId: string, ratio: string, variantId: string]
  'use-style': [conceptId: string]
}>()
</script>

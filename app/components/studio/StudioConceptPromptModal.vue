<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
  >
    <div class="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
      <div class="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
        <div>
          <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">Editor de prompt</p>
          <h2 class="mt-2 text-lg font-medium text-text">
            {{ concept?.title }} &middot; {{ concept?.selectedRatio }}
          </h2>
          <p class="mt-2 text-sm leading-6 text-text-muted">
            {{ description }}
          </p>
        </div>

        <button
          type="button"
          class="rounded border border-border p-1.5 text-text-muted transition hover:border-text-muted hover:text-text"
          @click="$emit('close')"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-6 py-5">
        <AppTextarea
          :model-value="draft"
          :rows="18"
          :disabled="!canEdit"
          placeholder="Describe composicion, texto, tono y montaje."
          @update:model-value="$emit('update:draft', $event)"
        />
      </div>

      <div class="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
        <button
          type="button"
          class="text-xs text-text-muted transition hover:text-text disabled:opacity-40"
          :disabled="!concept"
          @click="$emit('reset')"
        >
          Restaurar original
        </button>

        <div class="flex gap-3">
          <button
            type="button"
            class="rounded-lg border border-border px-4 py-2 text-sm text-text-muted transition hover:border-text-muted hover:text-text"
            @click="$emit('close')"
          >
            Cancelar
          </button>

          <AppButton
            type="button"
            :disabled="!canEdit"
            @click="$emit('save')"
          >
            Guardar prompt
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StudioConcept } from '../../../shared/types/studio'

import AppButton from '~/components/base/AppButton.vue'
import AppTextarea from '~/components/base/AppTextarea.vue'

defineProps<{
  open: boolean
  concept: StudioConcept | null
  draft: string
  description: string
  canEdit: boolean
}>()

defineEmits<{
  close: []
  reset: []
  save: []
  'update:draft': [value: string]
}>()
</script>

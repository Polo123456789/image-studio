<template>
  <div class="flex items-center gap-2" role="group" aria-label="Evaluar imagen">
    <button
      v-for="value in values"
      :key="value"
      type="button"
      :disabled="disabled"
      :aria-pressed="rating === value"
      :aria-label="value === 'good' ? 'Marcar imagen como buena' : 'Marcar imagen como mala'"
      :title="value === 'good' ? 'Buena' : 'Mala'"
      class="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium shadow-sm transition disabled:cursor-wait disabled:opacity-50"
      :class="rating === value
        ? value === 'good' ? 'border-accent bg-accent/20 text-accent' : 'border-danger bg-danger/20 text-danger'
        : 'border-border bg-surface text-text hover:border-accent/60 hover:bg-surface-2'"
      @click="emit('rate', value)"
    >
      <svg class="h-4 w-4" :class="value === 'bad' ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true">
        <path d="M8 10l4-7c3 0 3 2 2 6h5c2 0 2 2 1 5l-2 6H8zM3 10h5v10H3z" />
      </svg>
      <span :class="labels ? '' : 'sr-only'">{{ value === 'good' ? 'Buena' : 'Mala' }}</span>
      <kbd v-if="shortcuts" class="ml-5 text-xs text-text-muted">{{ value === 'good' ? '→' : '←' }}</kbd>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { StudioReviewRating } from '../../../shared/types/studio'
withDefaults(defineProps<{
  rating?: StudioReviewRating
  disabled?: boolean
  labels?: boolean
  shortcuts?: boolean
}>(), { rating: null, disabled: false, labels: true, shortcuts: false })
const emit = defineEmits<{ rate: [rating: Exclude<StudioReviewRating, null>] }>()
const values = ['bad', 'good'] as const
</script>

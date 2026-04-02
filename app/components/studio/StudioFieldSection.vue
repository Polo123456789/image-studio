<template>
  <section class="space-y-4">
    <div class="flex items-center gap-3">
      <span class="font-mono text-xs text-accent">{{ number }}.</span>
      <h3 class="font-body text-xl font-medium text-text">
        {{ title }}
      </h3>
      <span
        v-if="badge"
        class="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted"
      >
        {{ badge }}
      </span>
    </div>

    <p v-if="description" class="max-w-3xl text-sm leading-7 text-text-muted">
      {{ description }}
    </p>

    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  number: number | string
  title: string
  description?: string
  badge?: string
}>()
</script>

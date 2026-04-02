<template>
  <div class="space-y-4 rounded-2xl border border-dashed border-border bg-bg/65 p-5">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="font-mono text-xs text-accent">{{ number }}.</span>
        <h3 class="font-body text-xl font-medium text-text">
          {{ title }}
        </h3>
      </div>
      <span class="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
        Pendiente
      </span>
    </div>

    <p class="text-sm leading-7 text-text-muted">
      {{ description }}
    </p>

    <div class="rounded-xl border border-border bg-surface px-4 py-5 text-sm text-text-muted">
      {{ placeholder }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  number: number | string
  title: string
  description: string
  placeholder: string
}>()
</script>

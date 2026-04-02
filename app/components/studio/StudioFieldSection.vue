<template>
  <section class="space-y-3">
    <div>
      <div class="flex items-baseline gap-2">
        <h3 class="text-sm font-medium text-text">{{ title }}</h3>
        <span v-if="hint" class="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
          {{ hint }}
        </span>
      </div>
      <p v-if="description" class="mt-1 text-sm leading-5 text-text-muted">
        {{ description }}
      </p>
    </div>

    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  hint?: string
}>()
</script>

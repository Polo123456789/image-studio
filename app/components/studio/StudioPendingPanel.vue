<template>
  <div class="space-y-2">
    <div class="flex items-baseline gap-2">
      <h3 class="text-sm font-medium text-text-muted/60">{{ title }}</h3>
      <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted/40">pendiente</span>
    </div>
    <p class="text-sm leading-5 text-text-muted/40">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

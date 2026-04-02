<template>
  <div class="relative">
    <select
      v-model="model"
      v-bind="$attrs"
      class="w-full appearance-none rounded border border-border bg-surface-2 px-3 py-2.5 pr-8 text-sm text-text outline-none transition focus:border-accent"
    >
      <slot />
    </select>
    <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-text-muted">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2 4.5L6 8.5L10 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

const model = defineModel<string | number>({
  default: '',
})
</script>

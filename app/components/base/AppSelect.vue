<template>
  <select
    v-model="model"
    v-bind="$attrs"
    class="w-full rounded-xl border border-border bg-bg px-4 py-4 text-base text-text outline-none transition focus:border-accent"
  >
    <slot />
  </select>
</template>

<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

const model = defineModel<string | number>({
  default: '',
})
</script>

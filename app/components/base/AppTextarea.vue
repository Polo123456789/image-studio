<template>
  <textarea
    v-model="model"
    v-bind="$attrs"
    class="w-full resize-y rounded border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent"
  ></textarea>
</template>

<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

const model = defineModel<string>({
  default: '',
})
</script>

<template>
  <input
    v-model="model"
    :type="type"
    v-bind="$attrs"
    class="w-full rounded border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent"
  >
</template>

<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

withDefaults(defineProps<{
  type?: string
}>(), {
  type: 'text',
})

const model = defineModel<string | number>({
  default: '',
})
</script>

<template>
  <input
    v-model="model"
    :type="type"
    v-bind="$attrs"
    class="w-full rounded-xl border border-border bg-bg px-4 py-4 text-base text-text outline-none transition placeholder:text-text-muted focus:border-accent"
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

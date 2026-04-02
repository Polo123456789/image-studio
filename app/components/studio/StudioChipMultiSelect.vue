<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="option in options"
      :key="option"
      type="button"
      class="rounded border px-3 py-1.5 font-mono text-xs transition"
      :class="selectedValues.includes(option)
        ? 'border-accent bg-accent/10 text-accent'
        : 'border-border text-text-muted hover:border-border/80 hover:text-text'"
      @click="toggleOption(option)"
    >
      {{ option }}
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  options: string[]
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const selectedValues = computed(() => props.modelValue)

function toggleOption(option: string) {
  if (selectedValues.value.includes(option)) {
    emit('update:modelValue', selectedValues.value.filter((item) => item !== option))
    return
  }

  emit('update:modelValue', [...selectedValues.value, option])
}
</script>

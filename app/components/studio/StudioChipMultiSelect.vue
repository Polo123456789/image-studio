<template>
  <div class="flex flex-wrap gap-3">
    <button
      v-for="option in options"
      :key="option"
      type="button"
      class="rounded-full border px-4 py-2 text-sm transition"
      :class="selectedValues.includes(option)
        ? 'border-accent bg-accent text-bg shadow-sm'
        : 'border-border bg-bg text-text-muted hover:border-accent/60 hover:text-text'"
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

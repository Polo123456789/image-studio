<template>
  <StudioFieldSection
    title="Estilo creativo"
    hint="Opcional"
    :description="selectedGuideId !== null
      ? 'La guia de estilo tiene prioridad. Este campo solo aplica cuando no hay guia seleccionada.'
      : 'Si no eliges nada, Gemini decidira el estilo mas conveniente para cada concepto usando la biblioteca activa.'"
  >
    <div class="space-y-4">
      <AppSelect v-model="selectedValue" :disabled="selectedGuideId !== null">
        <option value="">Aleatorio</option>
        <option v-for="style in activeStyles" :key="style.id" :value="String(style.id)">
          {{ style.name }}
        </option>
      </AppSelect>

      <div v-if="selectedStyle" class="overflow-hidden rounded-lg border border-accent/20 bg-accent/5">
        <div class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start">
          <img
            v-if="selectedStyle.referenceImageUrl"
            :src="selectedStyle.referenceImageUrl"
            :alt="selectedStyle.name"
            class="h-20 w-full rounded-lg border border-accent/10 object-cover sm:w-28"
          >

          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-text">{{ selectedStyle.name }}</p>
            <p v-if="selectedStyle.description" class="mt-1.5 text-xs leading-5 text-text-muted">
              {{ selectedStyle.description }}
            </p>
          </div>
        </div>
      </div>

      <p v-else class="text-xs leading-5 text-text-muted">
        Gemini elegira el estilo segun la idea, el texto y la composicion de cada concepto.
      </p>
    </div>
  </StudioFieldSection>
</template>

<script setup lang="ts">
import type { CreativeStyleRecord } from '../../../shared/types/creative-styles'

import AppSelect from '~/components/base/AppSelect.vue'
import StudioFieldSection from '~/components/studio/StudioFieldSection.vue'

const props = defineProps<{
  styles: CreativeStyleRecord[]
  selectedGuideId?: number | null
}>()

const selectedStyleId = defineModel<number | null>('selectedStyleId', {
  default: null
})

const selectedValue = computed<string>({
  get() {
    return selectedStyleId.value === null ? '' : String(selectedStyleId.value)
  },
  set(value: string) {
    selectedStyleId.value = value ? Number(value) : null
  }
})

const activeStyles = computed(() => props.styles.filter((style) => style.isActive))
const selectedStyle = computed(() => activeStyles.value.find((style) => style.id === selectedStyleId.value) ?? null)

watch(() => props.selectedGuideId, (guideId) => {
  if (guideId !== null) {
    selectedStyleId.value = null
  }
})
</script>

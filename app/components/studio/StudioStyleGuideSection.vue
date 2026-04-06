<template>
  <StudioFieldSection
    title="Guia de estilo"
    hint="Opcional"
    description="Aplica una guia reutilizable al proyecto. Agrega ajustes manuales si hace falta."
  >
    <div class="space-y-4">
      <!-- Combobox selector -->
      <AppCombobox
        v-model="selectedValue"
        :options="comboboxOptions"
        placeholder="Sin guia aplicada"
        search-placeholder="Buscar guia por nombre o marca..."
        empty-label="Sin guia aplicada"
        no-results-text="No hay guias que coincidan."
        clearable
      />

      <!-- Selected guide preview -->
      <div v-if="selectedGuide" class="overflow-hidden rounded-lg border border-accent/20 bg-accent/5">
        <div class="flex items-center justify-between gap-3 px-4 py-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-text">{{ selectedGuide.name }}</p>
            <p class="mt-0.5 text-xs text-text-muted">
              {{ selectedGuide.brandName ? `Marca: ${selectedGuide.brandName}` : 'Guia global' }}
            </p>
          </div>

          <button
            type="button"
            class="shrink-0 text-xs text-text-muted transition hover:text-text"
            @click="previewOpen = !previewOpen"
          >
            {{ previewOpen ? 'Ocultar' : 'Ver contenido' }}
          </button>
        </div>

        <div
          v-if="previewOpen"
          class="max-h-48 overflow-y-auto border-t border-accent/15 bg-bg/50 px-4 py-3 font-mono text-xs leading-5 text-text-muted whitespace-pre-wrap"
        >
          {{ selectedGuide.content }}
        </div>
      </div>

      <!-- Notes -->
      <label class="block text-sm font-medium text-text">
        Ajustes adicionales
        <AppTextarea
          v-model="notes"
          class="mt-2"
          :rows="4"
          placeholder="Ej. Mantener direccion editorial sobria, composicion aireada y luz suave lateral."
        />
      </label>
    </div>
  </StudioFieldSection>
</template>

<script setup lang="ts">
import type { ComboboxOption } from '~/components/base/AppCombobox.vue'
import type { StyleGuideRecord } from '../../../shared/types/style-guides'

import AppCombobox from '~/components/base/AppCombobox.vue'
import AppTextarea from '~/components/base/AppTextarea.vue'
import StudioFieldSection from '~/components/studio/StudioFieldSection.vue'

const props = defineProps<{
  guides: StyleGuideRecord[]
  brandName?: string
}>()

const selectedGuideId = defineModel<number | null>('selectedGuideId', {
  default: null
})

const notes = defineModel<string>('notes', {
  default: ''
})

const previewOpen = ref(false)

// Bridge between combobox (string | number | null) and our number | null model
const selectedValue = computed<number | null>({
  get() {
    return selectedGuideId.value
  },
  set(value: number | null) {
    selectedGuideId.value = value
    // Auto-open preview when a new guide is selected
    if (value != null) previewOpen.value = true
  }
})

const selectedGuide = computed(() => {
  return props.guides.find((g) => g.id === selectedGuideId.value) ?? null
})

// Build combobox options grouped by brand relevance
const comboboxOptions = computed<ComboboxOption[]>(() => {
  const brand = props.brandName
  const items: ComboboxOption[] = []

  // Sort: current brand first, global second, other brands third
  const sorted = [...props.guides].sort((a, b) => {
    const aPriority = a.brandName === brand ? 0 : a.brandId === null ? 1 : 2
    const bPriority = b.brandName === brand ? 0 : b.brandId === null ? 1 : 2
    if (aPriority !== bPriority) return aPriority - bPriority
    return a.name.localeCompare(b.name, 'es')
  })

  for (const guide of sorted) {
    let group: string
    if (brand && guide.brandName === brand) {
      group = brand
    } else if (guide.brandId === null) {
      group = 'Global'
    } else {
      group = guide.brandName ?? 'Otra marca'
    }

    items.push({
      value: guide.id,
      label: guide.name,
      hint: guide.brandId === null ? 'Global' : guide.brandName ?? undefined,
      group,
    })
  }

  return items
})
</script>

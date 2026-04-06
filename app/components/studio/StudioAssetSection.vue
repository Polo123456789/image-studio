<template>
  <StudioFieldSection
    title="Assets"
    hint="Opcional"
    description="Sube assets nuevos o reutiliza los ya cargados. Los de la marca seleccionada aparecen primero."
  >
    <div class="space-y-4">
      <div class="rounded-xl border border-border bg-surface/70 p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label class="block flex-1 text-xs font-medium text-text-muted">
            Nombre visible
            <AppInput
              v-model="uploadName"
              class="mt-1.5"
              type="text"
              placeholder="Ej. Packshot botella frontal"
            />
          </label>

          <label class="block flex-1 text-xs font-medium text-text-muted">
            Alcance
            <AppSelect v-model="uploadBrandSelection" class="mt-1.5">
              <option value="">Global</option>
              <option v-for="brand in brands" :key="brand.id" :value="String(brand.id)">
                {{ brand.name }}
              </option>
            </AppSelect>
          </label>
        </div>

        <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label class="inline-flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-text-muted transition hover:border-accent/40 hover:text-text">
            <input class="hidden" type="file" accept="image/*" :disabled="uploading" @change="onFileChange">
            <svg class="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            <span>{{ uploading ? 'Subiendo...' : 'Subir asset' }}</span>
          </label>

          <p v-if="feedback" class="text-xs" :class="feedbackTone === 'error' ? 'text-danger' : 'text-accent'">
            {{ feedback }}
          </p>
          <p v-else class="text-xs text-text-muted">
            Descripcion y tags se generan automaticamente cuando hay API key configurada.
          </p>
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AppInput
            v-model="search"
            type="text"
            placeholder="Buscar por nombre, descripcion o tags"
          />

          <div class="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-text-muted">
            {{ selectedCountText }}
          </div>
        </div>

        <div v-if="sortedAssets.length" class="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          <button
            v-for="asset in sortedAssets"
            :key="asset.id"
            type="button"
            class="w-full rounded-xl border p-3 text-left transition"
            :class="selectedAssetIds.includes(asset.id)
              ? 'border-accent/50 bg-accent/8'
              : 'border-border bg-surface hover:border-accent/30 hover:bg-surface-2/50'"
            @click="toggleAsset(asset.id)"
          >
            <div class="flex gap-3">
              <img :src="asset.fileUrl" :alt="asset.name" class="h-16 w-16 rounded-lg border border-border object-cover bg-surface-2">

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="truncate text-sm text-text">{{ asset.name }}</p>
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    :class="asset.brandId === null ? 'bg-surface-2 text-text-muted' : 'bg-accent/12 text-accent'">
                    {{ asset.brandName ?? 'Global' }}
                  </span>
                  <span v-if="selectedAssetIds.includes(asset.id)" class="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-bg">
                    Seleccionado
                  </span>
                </div>

                <p class="mt-1 line-clamp-2 text-xs leading-5 text-text-muted">
                  {{ asset.description || 'Sin descripcion generada todavia.' }}
                </p>

                <div class="mt-2 flex flex-wrap gap-1.5">
                  <span
                    v-for="tag in asset.tags"
                    :key="tag"
                    class="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[10px] text-text-muted"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>

        <div v-else class="rounded-xl border border-border bg-surface px-4 py-8 text-center text-sm text-text-muted">
          {{ search.trim() ? 'No hay assets que coincidan con la busqueda.' : 'Todavia no hay assets cargados.' }}
        </div>
      </div>
    </div>
  </StudioFieldSection>
</template>

<script setup lang="ts">
import type { AssetRecord } from '../../../shared/types/assets'
import type { BrandOption } from '../../../shared/types/style-guides'

import AppInput from '~/components/base/AppInput.vue'
import AppSelect from '~/components/base/AppSelect.vue'
import StudioFieldSection from '~/components/studio/StudioFieldSection.vue'

const props = defineProps<{
  assets: AssetRecord[]
  brands: BrandOption[]
  brandName?: string
}>()

const selectedAssetIds = defineModel<number[]>('selectedAssetIds', { default: [] })
const emit = defineEmits<{
  assetsUploaded: []
}>()

const search = ref('')
const uploadName = ref('')
const uploadBrandSelection = ref('')
const feedback = ref('')
const feedbackTone = ref<'success' | 'error'>('success')
const uploading = ref(false)

watch(() => props.brandName, (brandName) => {
  if (!brandName) {
    uploadBrandSelection.value = ''
    return
  }

  const matchingBrand = props.brands.find((brand) => brand.name === brandName)

  if (matchingBrand) {
    uploadBrandSelection.value = String(matchingBrand.id)
  }
}, { immediate: true })

const sortedAssets = computed(() => {
  const term = search.value.trim().toLowerCase()
  const filtered = term
    ? props.assets.filter((asset) => {
      const haystack = [
        asset.name,
        asset.brandName || '',
        asset.description,
        asset.tags.join(' ')
      ].join(' ').toLowerCase()

      return haystack.includes(term)
    })
    : props.assets

  return [...filtered].sort((left, right) => {
    const leftPriority = left.brandName === props.brandName ? 0 : left.brandId === null ? 1 : 2
    const rightPriority = right.brandName === props.brandName ? 0 : right.brandId === null ? 1 : 2

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority
    }

    return right.createdAt.localeCompare(left.createdAt) || left.name.localeCompare(right.name, 'es')
  })
})

const selectedCountText = computed(() => {
  const count = selectedAssetIds.value.length

  return count === 1 ? '1 asset seleccionado' : `${count} assets seleccionados`
})

function toggleAsset(assetId: number) {
  if (selectedAssetIds.value.includes(assetId)) {
    selectedAssetIds.value = selectedAssetIds.value.filter((id) => id !== assetId)
    return
  }

  selectedAssetIds.value = [...selectedAssetIds.value, assetId]
}

function getUploadErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const maybeStatusMessage = 'statusMessage' in error ? error.statusMessage : undefined
    if (typeof maybeStatusMessage === 'string' && maybeStatusMessage) return maybeStatusMessage

    const maybeData = 'data' in error ? error.data : undefined
    if (typeof maybeData === 'object' && maybeData !== null && 'statusMessage' in maybeData) {
      const nestedStatusMessage = maybeData.statusMessage
      if (typeof nestedStatusMessage === 'string' && nestedStatusMessage) return nestedStatusMessage
    }
  }

  return 'No se pudo subir el asset.'
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]

  if (!file) {
    return
  }

  const formData = new FormData()
  formData.append('file', file)

  if (uploadName.value.trim()) {
    formData.append('name', uploadName.value.trim())
  }

  if (uploadBrandSelection.value) {
    formData.append('brandId', uploadBrandSelection.value)
  }

  uploading.value = true
  feedback.value = ''

  try {
    const response = await $fetch<{ asset: AssetRecord, duplicate: boolean }>('/api/assets', {
      method: 'POST',
      body: formData
    })

    if (!selectedAssetIds.value.includes(response.asset.id)) {
      selectedAssetIds.value = [...selectedAssetIds.value, response.asset.id]
    }

    feedbackTone.value = 'success'
    feedback.value = response.duplicate
      ? 'Ese asset ya existia. Se selecciono la version guardada.'
      : 'Asset subido y seleccionado.'
    uploadName.value = ''
    emit('assetsUploaded')
  }
  catch (error) {
    feedbackTone.value = 'error'
    feedback.value = getUploadErrorMessage(error)
  }
  finally {
    uploading.value = false

    if (input) {
      input.value = ''
    }
  }
}
</script>

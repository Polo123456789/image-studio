<template>
  <StudioFieldSection
    title="Assets"
    hint="Opcional"
    description="Adjunta referencias, logos, productos o fondos al proyecto."
  >
    <!-- Empty state: dashed trigger to open modal -->
    <button
      v-if="!selectedAssetIds.length"
      type="button"
      class="group w-full rounded-xl border-2 border-dashed border-border px-6 py-8 text-center transition hover:border-accent/30 hover:bg-surface-2/30"
      @click="modalOpen = true"
    >
      <div class="flex flex-col items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-text-muted transition group-hover:bg-accent/12 group-hover:text-accent">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
        </div>
        <div>
          <p class="text-sm text-text-muted transition group-hover:text-text">Seleccionar assets</p>
          <p class="mt-1 text-xs text-text-muted">Busca en la biblioteca o sube nuevos</p>
        </div>
      </div>
    </button>

    <!-- Selected assets preview -->
    <div v-else class="space-y-3">
      <div class="flex flex-wrap gap-2">
        <div
          v-for="asset in selectedAssetsPreview"
          :key="asset.id"
          class="group relative"
        >
          <img
            :src="asset.fileUrl"
            :alt="asset.name"
            class="h-14 w-14 rounded-lg border border-border object-cover bg-surface-2"
            :title="asset.name"
          >
          <button
            type="button"
            class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-surface-2 text-text-muted opacity-0 transition hover:border-danger hover:bg-danger hover:text-bg group-hover:opacity-100"
            :title="`Quitar ${asset.name}`"
            @click="removeAsset(asset.id)"
          >
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <span
          v-if="overflowCount > 0"
          class="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-surface-2 text-xs text-text-muted"
        >
          +{{ overflowCount }}
        </span>
      </div>

      <div class="flex items-center justify-between gap-3">
        <span class="text-xs text-text-muted">
          {{ selectedAssetIds.length }} {{ selectedAssetIds.length === 1 ? 'asset seleccionado' : 'assets seleccionados' }}
        </span>
        <button
          type="button"
          class="text-xs text-accent underline underline-offset-2 transition hover:text-text"
          @click="modalOpen = true"
        >
          Editar seleccion
        </button>
      </div>
    </div>

    <!-- Asset picker modal -->
    <StudioAssetModal
      :open="modalOpen"
      :initial-selection="selectedAssetIds"
      :assets="assets"
      :brands="brands"
      :brand-name="brandName"
      @close="modalOpen = false"
      @confirm="onConfirm"
      @assets-uploaded="$emit('assetsUploaded')"
    />
  </StudioFieldSection>
</template>

<script setup lang="ts">
import type { AssetRecord } from '../../../shared/types/assets'
import type { BrandOption } from '../../../shared/types/brands'

import StudioAssetModal from '~/components/studio/StudioAssetModal.vue'
import StudioFieldSection from '~/components/studio/StudioFieldSection.vue'

const props = defineProps<{
  assets: AssetRecord[]
  brands: BrandOption[]
  brandName?: string
}>()

const selectedAssetIds = defineModel<number[]>('selectedAssetIds', { default: [] })

defineEmits<{
  assetsUploaded: []
}>()

const modalOpen = ref(false)

const MAX_PREVIEW = 6

const selectedAssetsPreview = computed(() => {
  return props.assets
    .filter(a => selectedAssetIds.value.includes(a.id))
    .slice(0, MAX_PREVIEW)
})

const overflowCount = computed(() => {
  return Math.max(0, selectedAssetIds.value.length - MAX_PREVIEW)
})

function removeAsset(id: number) {
  selectedAssetIds.value = selectedAssetIds.value.filter(i => i !== id)
}

function onConfirm(ids: number[]) {
  selectedAssetIds.value = ids
  modalOpen.value = false
}
</script>

<template>
  <AppModal :open="open" size="5xl" @close="handleClose">
    <!-- Header -->
    <div class="shrink-0 border-b border-border">
      <div class="flex items-center justify-between gap-4 px-5 pt-4 pb-3">
        <div>
          <h2 class="font-display text-lg text-text">Seleccionar assets</h2>
          <p class="mt-0.5 text-xs text-text-muted">
            {{ assets.length }} {{ assets.length === 1 ? 'asset disponible' : 'assets disponibles' }}
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-lg border border-border p-2 text-text-muted transition hover:border-text-muted hover:text-text"
          @click="handleClose"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <!-- Search -->
      <div class="px-5 pb-3">
        <div class="relative">
          <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            ref="searchInputRef"
            v-model="search"
            type="text"
            placeholder="Buscar por nombre, descripcion o tags..."
            class="w-full rounded-lg border border-border bg-surface-2 py-2.5 pl-10 pr-4 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent"
          >
        </div>
      </div>

      <!-- Brand filter pills -->
      <div class="scrollbar-none flex gap-1.5 overflow-x-auto px-5 pb-3">
        <button
          v-for="filter in brandFilters"
          :key="filter.id"
          type="button"
          class="shrink-0 rounded-full border px-3 py-1 text-xs transition"
          :class="activeBrandFilter === filter.id
            ? 'border-accent/40 bg-accent/12 text-accent'
            : 'border-border bg-surface-2/50 text-text-muted hover:border-accent/20 hover:text-text'"
          @click="activeBrandFilter = filter.id"
        >
          {{ filter.label }}
          <span class="ml-1 font-mono text-[10px] opacity-60">{{ filter.count }}</span>
        </button>
      </div>
    </div>

    <!-- Body -->
    <div
      class="relative flex-1 overflow-y-auto"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <!-- Drag overlay -->
      <Transition
        enter-active-class="transition-opacity duration-150"
        leave-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="isDragging" class="absolute inset-0 z-10 flex items-center justify-center bg-surface/90 backdrop-blur-sm">
          <div class="rounded-2xl border-2 border-dashed border-accent/40 px-12 py-10 text-center">
            <svg class="mx-auto h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            <p class="mt-3 text-sm text-text">Suelta la imagen para subirla</p>
          </div>
        </div>
      </Transition>

      <!-- Upload feedback -->
      <div
        v-if="uploadFeedback"
        class="mx-5 mt-4 rounded-lg border px-4 py-2.5 text-xs"
        :class="uploadFeedbackTone === 'error'
          ? 'border-danger/30 bg-danger/8 text-danger'
          : 'border-accent/30 bg-accent/8 text-accent'"
      >
        {{ uploadFeedback }}
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <!-- Upload card -->
        <button
          type="button"
          class="group flex aspect-square flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface-2/20 transition hover:border-accent/30 hover:bg-surface-2/50"
          :class="{ 'pointer-events-none opacity-60': uploading }"
          @click="triggerFileInput"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-text-muted transition group-hover:bg-accent/12 group-hover:text-accent">
            <svg v-if="!uploading" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            <svg v-else class="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          </div>
          <span class="text-xs text-text-muted transition group-hover:text-text">
            {{ uploading ? 'Subiendo...' : 'Subir asset' }}
          </span>
        </button>

        <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onFileSelected">

        <!-- Asset cards -->
        <button
          v-for="asset in filteredAssets"
          :key="asset.id"
          type="button"
          class="group overflow-hidden rounded-xl border text-left transition"
          :class="isSelected(asset.id)
            ? 'border-accent/50 bg-accent/5 ring-1 ring-accent/20'
            : 'border-border bg-surface-2/20 hover:border-accent/25 hover:bg-surface-2/40'"
          @click="toggleAsset(asset.id)"
        >
          <div class="relative aspect-square overflow-hidden bg-surface-2">
            <img
              :src="asset.fileUrl"
              :alt="asset.name"
              class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            >

            <!-- Selected checkmark -->
            <Transition
              enter-active-class="transition-all duration-150 ease-out"
              leave-active-class="transition-all duration-100 ease-in"
              enter-from-class="scale-50 opacity-0"
              leave-to-class="scale-50 opacity-0"
            >
              <div
                v-if="isSelected(asset.id)"
                class="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent shadow-md"
              >
                <svg class="h-3.5 w-3.5 text-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
            </Transition>
          </div>

          <div class="px-3 py-2.5">
            <p class="truncate text-xs font-medium text-text">{{ asset.name }}</p>
            <div class="mt-1 flex items-center gap-1.5">
              <span
                class="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                :class="asset.brandId === null
                  ? 'bg-surface-2 text-text-muted'
                  : 'bg-accent/10 text-accent'"
              >
                {{ asset.brandName ?? 'Global' }}
              </span>
              <span v-if="asset.tags.length" class="truncate text-[9px] text-text-muted">
                {{ asset.tags.slice(0, 2).join(', ') }}
              </span>
            </div>
          </div>
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="!filteredAssets.length && !uploading" class="px-5 pb-8 pt-4 text-center">
        <div class="mx-auto max-w-xs">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-2">
            <svg class="h-6 w-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
          </div>
          <p class="mt-3 text-sm text-text-muted">
            {{ search.trim() ? 'No hay assets que coincidan con la busqueda.' : 'Todavia no hay assets cargados.' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="shrink-0 border-t border-border px-5 py-3">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="text-sm text-text-muted">
            <span class="font-mono text-text">{{ localSelection.length }}</span>
            {{ localSelection.length === 1 ? 'seleccionado' : 'seleccionados' }}
          </span>
          <button
            v-if="localSelection.length"
            type="button"
            class="text-xs text-text-muted underline underline-offset-2 transition hover:text-text"
            @click="localSelection = []"
          >
            Limpiar
          </button>
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="rounded-lg border border-border px-4 py-2 text-sm text-text-muted transition hover:border-text-muted hover:text-text"
            @click="handleClose"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-bg transition hover:opacity-90"
            @click="handleConfirm"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import type { AssetRecord } from '../../../shared/types/assets'
import type { BrandOption } from '../../../shared/types/style-guides'

import AppModal from '~/components/base/AppModal.vue'

const props = defineProps<{
  open: boolean
  initialSelection: number[]
  assets: AssetRecord[]
  brands: BrandOption[]
  brandName?: string
}>()

const emit = defineEmits<{
  close: []
  confirm: [ids: number[]]
  assetsUploaded: []
}>()

const search = ref('')
const activeBrandFilter = ref<string>('all')
const localSelection = ref<number[]>([])
const isDragging = ref(false)
const uploading = ref(false)
const uploadFeedback = ref('')
const uploadFeedbackTone = ref<'success' | 'error'>('success')
const fileInputRef = ref<HTMLInputElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)

// Reset state when modal opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    localSelection.value = [...props.initialSelection]
    search.value = ''
    uploadFeedback.value = ''
    isDragging.value = false

    if (props.brandName) {
      const matchingBrand = props.brands.find(b => b.name === props.brandName)
      activeBrandFilter.value = matchingBrand ? String(matchingBrand.id) : 'all'
    } else {
      activeBrandFilter.value = 'all'
    }

    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }
})

// Brand filter pills
const brandFilters = computed(() => {
  const filters: { id: string, label: string, count: number }[] = [
    { id: 'all', label: 'Todos', count: props.assets.length },
    { id: 'global', label: 'Global', count: props.assets.filter(a => a.brandId === null).length },
  ]

  const brandCounts = new Map<number, { name: string, count: number }>()

  for (const asset of props.assets) {
    if (asset.brandId !== null && asset.brandName) {
      const existing = brandCounts.get(asset.brandId)

      if (existing) {
        existing.count++
      } else {
        brandCounts.set(asset.brandId, { name: asset.brandName, count: 1 })
      }
    }
  }

  for (const [id, { name, count }] of brandCounts) {
    filters.push({ id: String(id), label: name, count })
  }

  return filters
})

// Filtered + sorted assets
const filteredAssets = computed(() => {
  let result = [...props.assets]

  if (activeBrandFilter.value === 'global') {
    result = result.filter(a => a.brandId === null)
  } else if (activeBrandFilter.value !== 'all') {
    const brandId = Number(activeBrandFilter.value)
    result = result.filter(a => a.brandId === brandId)
  }

  const term = search.value.trim().toLowerCase()

  if (term) {
    result = result.filter((asset) => {
      const haystack = [
        asset.name,
        asset.brandName || '',
        asset.description,
        asset.tags.join(' '),
      ].join(' ').toLowerCase()

      return haystack.includes(term)
    })
  }

  return result.sort((a, b) => {
    const aSelected = localSelection.value.includes(a.id) ? 0 : 1
    const bSelected = localSelection.value.includes(b.id) ? 0 : 1

    if (aSelected !== bSelected) return aSelected - bSelected

    const aPriority = a.brandName === props.brandName ? 0 : a.brandId === null ? 1 : 2
    const bPriority = b.brandName === props.brandName ? 0 : b.brandId === null ? 1 : 2

    if (aPriority !== bPriority) return aPriority - bPriority

    return b.createdAt.localeCompare(a.createdAt)
  })
})

function isSelected(id: number) {
  return localSelection.value.includes(id)
}

function toggleAsset(id: number) {
  if (localSelection.value.includes(id)) {
    localSelection.value = localSelection.value.filter(i => i !== id)
  } else {
    localSelection.value = [...localSelection.value, id]
  }
}

function handleClose() {
  emit('close')
}

function handleConfirm() {
  emit('confirm', [...localSelection.value])
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function prettifyFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim() || 'Asset'
}

async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', prettifyFilename(file.name))

  if (activeBrandFilter.value !== 'all' && activeBrandFilter.value !== 'global') {
    formData.append('brandId', activeBrandFilter.value)
  }

  uploading.value = true
  uploadFeedback.value = ''

  try {
    const response = await $fetch<{ asset: AssetRecord, duplicate: boolean }>('/api/assets', {
      method: 'POST',
      body: formData,
    })

    if (!localSelection.value.includes(response.asset.id)) {
      localSelection.value = [...localSelection.value, response.asset.id]
    }

    uploadFeedbackTone.value = 'success'
    uploadFeedback.value = response.duplicate
      ? 'Ese asset ya existia. Se selecciono la version guardada.'
      : 'Asset subido y seleccionado.'
    emit('assetsUploaded')
  }
  catch (error) {
    uploadFeedbackTone.value = 'error'
    uploadFeedback.value = getUploadErrorMessage(error)
  }
  finally {
    uploading.value = false

    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]

  if (file) {
    uploadFile(file)
  }
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]

  if (file && file.type.startsWith('image/')) {
    uploadFile(file)
  }
}

function getUploadErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const maybeStatusMessage = 'statusMessage' in error ? error.statusMessage : undefined

    if (typeof maybeStatusMessage === 'string' && maybeStatusMessage) {
      return maybeStatusMessage
    }

    const maybeData = 'data' in error ? error.data : undefined

    if (typeof maybeData === 'object' && maybeData !== null && 'statusMessage' in maybeData) {
      const nestedStatusMessage = maybeData.statusMessage

      if (typeof nestedStatusMessage === 'string' && nestedStatusMessage) {
        return nestedStatusMessage
      }
    }
  }

  return 'No se pudo subir el asset.'
}
</script>

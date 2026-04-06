<template>
  <div class="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
    <div class="mx-auto max-w-7xl">
      <!-- Header -->
      <header class="mb-10">
        <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Biblioteca</p>
        <h1 class="mt-3 font-display text-3xl text-text">Assets</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
          Sube referencias, logos, productos y fondos reutilizables.
          Los duplicados se detectan por hash antes de guardar.
        </p>

        <!-- Stats -->
        <div class="mt-5 flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2">
            <span class="font-mono text-lg text-text">{{ assets.length }}</span>
            <span class="text-xs text-text-muted">totales</span>
          </div>
          <div class="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2">
            <span class="font-mono text-lg text-text">{{ globalAssetsCount }}</span>
            <span class="text-xs text-text-muted">globales</span>
          </div>
          <div class="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2">
            <span class="font-mono text-lg text-text">{{ brandAssetsCount }}</span>
            <span class="text-xs text-text-muted">de marca</span>
          </div>
          <div class="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2">
            <span class="font-mono text-lg text-text">{{ totalSizeFormatted }}</span>
            <span class="text-xs text-text-muted">almacenado</span>
          </div>
        </div>
      </header>

      <div v-if="pending" class="rounded-xl border border-border bg-surface px-6 py-16 text-center text-sm text-text-muted">
        Cargando assets...
      </div>

      <template v-else>
        <!-- Upload zone -->
        <section
          class="mb-8 rounded-xl border transition"
          :class="isDragging
            ? 'border-accent bg-accent/5'
            : 'border-dashed border-border bg-surface/40'"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDrop"
        >
          <div class="flex flex-col items-center gap-5 px-8 py-8 sm:flex-row sm:items-end sm:gap-6">
            <div class="flex shrink-0 flex-col items-center gap-2 sm:items-start">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-text-muted">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              </div>
              <p class="text-sm text-text-muted">
                {{ isDragging ? 'Suelta la imagen aqui' : 'Arrastra una imagen o usa los campos' }}
              </p>
            </div>

            <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
              <label class="block flex-1 text-xs font-medium text-text-muted">
                Nombre
                <AppInput
                  v-model="uploadName"
                  class="mt-1.5"
                  type="text"
                  placeholder="Ej. Packshot botella frontal"
                />
              </label>

              <label class="block w-full text-xs font-medium text-text-muted sm:w-48">
                Alcance
                <AppSelect v-model="uploadBrandId" class="mt-1.5">
                  <option value="">Global</option>
                  <option v-for="brand in brandOptions" :key="brand.id" :value="String(brand.id)">
                    {{ brand.name }}
                  </option>
                </AppSelect>
              </label>

              <label
                class="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm text-text-muted transition hover:border-accent/40 hover:text-text"
                :class="{ 'pointer-events-none opacity-60': uploading }"
              >
                <input class="hidden" type="file" accept="image/*" :disabled="uploading" @change="onFileChange">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                <span>{{ uploading ? 'Subiendo...' : 'Subir' }}</span>
              </label>
            </div>
          </div>

          <div
            v-if="uploadFeedback"
            class="border-t border-border px-8 py-3 text-xs"
            :class="uploadFeedbackTone === 'error' ? 'text-danger' : 'text-accent'"
          >
            {{ uploadFeedback }}
          </div>
        </section>

        <!-- Search + brand filters -->
        <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div class="relative flex-1">
            <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              v-model="search"
              type="text"
              placeholder="Buscar por nombre, descripcion o tags..."
              class="w-full rounded-lg border border-border bg-surface-2 py-2.5 pl-10 pr-4 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent"
            >
          </div>

          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="filter in brandFilters"
              :key="filter.id"
              type="button"
              class="shrink-0 rounded-full border px-3 py-1.5 text-xs transition"
              :class="activeBrandFilter === filter.id
                ? 'border-accent/40 bg-accent/12 text-accent'
                : 'border-border text-text-muted hover:border-accent/20 hover:text-text'"
              @click="activeBrandFilter = filter.id"
            >
              {{ filter.label }}
              <span class="ml-1 font-mono text-[10px] opacity-60">{{ filter.count }}</span>
            </button>
          </div>
        </div>

        <!-- Gallery grid -->
        <div
          v-if="filteredAssets.length"
          class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          <article
            v-for="asset in filteredAssets"
            :key="asset.id"
            class="group overflow-hidden rounded-xl border border-border bg-surface transition hover:border-accent/25 hover:shadow-md"
          >
            <div class="relative aspect-[4/3] overflow-hidden bg-surface-2">
              <img
                :src="asset.fileUrl"
                :alt="asset.name"
                class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              >
              <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              <span
                class="absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm"
                :class="asset.brandId === null
                  ? 'bg-black/40 text-white/70'
                  : 'bg-accent/80 text-bg'"
              >
                {{ asset.brandName ?? 'Global' }}
              </span>
            </div>

            <div class="p-3.5">
              <h3 class="truncate text-sm font-medium text-text">{{ asset.name }}</h3>
              <p class="mt-0.5 truncate font-mono text-[10px] text-text-muted">
                {{ asset.originalFileName }}
              </p>

              <p
                v-if="asset.description"
                class="mt-2 line-clamp-2 text-xs leading-5 text-text-muted"
              >
                {{ asset.description }}
              </p>

              <div v-if="asset.tags.length" class="mt-2.5 flex flex-wrap gap-1">
                <span
                  v-for="tag in asset.tags.slice(0, 4)"
                  :key="tag"
                  class="rounded-full border border-border px-1.5 py-0.5 text-[9px] text-text-muted"
                >
                  {{ tag }}
                </span>
                <span v-if="asset.tags.length > 4" class="px-1 text-[9px] text-text-muted">
                  +{{ asset.tags.length - 4 }}
                </span>
              </div>

              <div class="mt-3 flex items-center justify-between border-t border-border pt-2.5 font-mono text-[10px] text-text-muted">
                <span>{{ formatFileSize(asset.fileSize) }}</span>
                <span>{{ formatDate(asset.createdAt) }}</span>
              </div>
            </div>
          </article>
        </div>

        <!-- Empty state -->
        <div v-else class="rounded-xl border border-border bg-surface px-8 py-20 text-center">
          <div class="mx-auto max-w-sm">
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-2">
              <svg class="h-7 w-7 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
            </div>
            <p class="mt-4 text-sm text-text">
              {{ search.trim() ? 'Sin resultados' : 'Todavia no hay assets' }}
            </p>
            <p class="mt-2 text-xs text-text-muted">
              {{ search.trim()
                ? 'Intenta con otro termino de busqueda.'
                : 'Sube el primer asset usando el panel de arriba o arrastra una imagen.' }}
            </p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AssetRecord, AssetsResponse } from '../../shared/types/assets'
import type { BrandOption } from '../../shared/types/brands'

import AppInput from '~/components/base/AppInput.vue'
import AppSelect from '~/components/base/AppSelect.vue'

const { data, pending, refresh } = await useFetch<AssetsResponse>('/api/assets')

const assets = computed<AssetRecord[]>(() => data.value?.assets ?? [])
const brandOptions = computed<BrandOption[]>(() => data.value?.brands ?? [])
const globalAssetsCount = computed(() => assets.value.filter(a => a.brandId === null).length)
const brandAssetsCount = computed(() => assets.value.filter(a => a.brandId !== null).length)
const totalSize = computed(() => assets.value.reduce((sum, a) => sum + (a.fileSize || 0), 0))
const totalSizeFormatted = computed(() => formatFileSize(totalSize.value))

const search = ref('')
const activeBrandFilter = ref('all')
const uploadName = ref('')
const uploadBrandId = ref('')
const uploading = ref(false)
const uploadFeedback = ref('')
const uploadFeedbackTone = ref<'success' | 'error'>('success')
const isDragging = ref(false)

// Brand filter pills
const brandFilters = computed(() => {
  const filters: { id: string, label: string, count: number }[] = [
    { id: 'all', label: 'Todos', count: assets.value.length },
    { id: 'global', label: 'Global', count: globalAssetsCount.value },
  ]

  const brandCounts = new Map<number, { name: string, count: number }>()

  for (const asset of assets.value) {
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
  let result = [...assets.value]

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

  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})

function prettifyFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim() || 'Asset'
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))

  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', uploadName.value.trim() || prettifyFilename(file.name))

  if (uploadBrandId.value) {
    formData.append('brandId', uploadBrandId.value)
  }

  uploading.value = true
  uploadFeedback.value = ''

  try {
    const response = await $fetch<{ asset: AssetRecord, duplicate: boolean }>('/api/assets', {
      method: 'POST',
      body: formData,
    })

    uploadFeedbackTone.value = 'success'
    uploadFeedback.value = response.duplicate
      ? 'Ese asset ya existia. Se reutilizo la version guardada.'
      : 'Asset subido correctamente.'
    uploadName.value = ''
    await refresh()
  }
  catch (error) {
    uploadFeedbackTone.value = 'error'
    uploadFeedback.value = getUploadErrorMessage(error)
  }
  finally {
    uploading.value = false
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]

  if (file) {
    uploadFile(file)
  }

  if (input) {
    input.value = ''
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

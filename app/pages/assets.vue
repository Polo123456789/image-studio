<template>
  <div class="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
    <div class="mx-auto max-w-7xl">

      <!-- Header -->
      <header class="mb-10">
        <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Biblioteca</p>
        <div class="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 class="font-display text-3xl text-text">Assets</h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
              Sube referencias, logos, productos y fondos reutilizables.
              Los duplicados se detectan por hash antes de guardar.
            </p>
          </div>
          <AppButton class="shrink-0" @click="openUploadModal()">
            Nuevo asset
          </AppButton>
        </div>

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

      <!-- Loading -->
      <div v-if="pending" class="rounded-xl border border-border bg-surface px-6 py-16 text-center text-sm text-text-muted">
        Cargando assets...
      </div>

      <template v-else>

        <!-- Notification bar -->
        <Transition
          enter-active-class="transition duration-300 ease-out"
          leave-active-class="transition duration-200 ease-in"
          enter-from-class="opacity-0 -translate-y-1"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <div
            v-if="notification.message"
            class="mb-6 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm"
            :class="notification.tone === 'error'
              ? 'border-danger/30 bg-danger/8 text-danger'
              : 'border-accent/30 bg-accent/8 text-accent'"
          >
            <span>{{ notification.message }}</span>
            <button
              type="button"
              class="shrink-0 opacity-60 transition hover:opacity-100"
              @click="clearNotification()"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </Transition>

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
            <!-- Image -->
            <div class="relative aspect-[4/3] overflow-hidden bg-surface-2">
              <img
                :src="asset.fileUrl"
                :alt="asset.name"
                class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              >
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              <span
                class="absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm"
                :class="asset.brandId === null
                  ? 'bg-black/50 text-white/70'
                  : 'bg-accent/80 text-bg'"
              >
                {{ asset.brandName ?? 'Global' }}
              </span>
            </div>

            <!-- Card body -->
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

              <!-- Meta -->
              <div class="mt-3 flex items-center justify-between border-t border-border pt-2.5 font-mono text-[10px] text-text-muted">
                <span>{{ formatFileSize(asset.fileSize) }}</span>
                <span>{{ formatDate(asset.createdAt) }}</span>
              </div>

              <!-- Actions -->
              <div class="mt-3">
                <!-- Inline delete confirmation -->
                <div
                  v-if="confirmDeleteId === asset.id"
                  class="flex items-center justify-between gap-2 rounded-lg border border-danger/25 bg-danger/8 px-3 py-2"
                >
                  <p class="truncate font-mono text-[10px] text-danger">Eliminar?</p>
                  <div class="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      class="text-xs text-text-muted transition hover:text-text disabled:opacity-50"
                      :disabled="assetActionId === asset.id"
                      @click="confirmDeleteId = null"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      class="rounded border border-danger/40 px-2 py-0.5 font-mono text-[10px] text-danger transition hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="assetActionId === asset.id"
                      @click="removeAsset(asset)"
                    >
                      {{ assetActionId === asset.id ? '...' : 'Si, eliminar' }}
                    </button>
                  </div>
                </div>

                <!-- Normal action row -->
                <div v-else class="flex items-center gap-2">
                  <AppSelect
                    :model-value="assetBrandSelection(asset)"
                    class="flex-1"
                    :disabled="assetActionId === asset.id"
                    @update:model-value="(value) => updateAssetBrand(asset, value)"
                  >
                    <option value="">Global</option>
                    <option v-for="brand in brandOptions" :key="brand.id" :value="String(brand.id)">
                      {{ brand.name }}
                    </option>
                  </AppSelect>

                  <button
                    type="button"
                    class="flex shrink-0 items-center justify-center rounded border border-border p-2.5 text-text-muted transition hover:border-danger/40 hover:bg-danger/5 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="assetActionId === asset.id"
                    :title="`Eliminar ${asset.name}`"
                    @click="confirmDeleteId = asset.id"
                  >
                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>

        <!-- Empty state -->
        <div v-else class="rounded-xl border border-border bg-surface px-8 py-20 text-center">
          <div class="mx-auto max-w-sm">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2">
              <svg class="h-6 w-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
            </div>
            <p class="mt-4 text-sm text-text">
              {{ search.trim() ? 'Sin resultados' : 'Todavia no hay assets' }}
            </p>
            <p class="mt-2 text-xs text-text-muted">
              {{ search.trim()
                ? 'Intenta con otro termino de busqueda.'
                : 'Sube el primer asset desde el boton de nuevo asset.' }}
            </p>
            <AppButton v-if="!search.trim()" class="mt-5" @click="openUploadModal()">
              Nuevo asset
            </AppButton>
          </div>
        </div>

      </template>
    </div>

    <!-- Upload modal -->
    <AppModal :open="isUploadModalOpen" size="xl" @close="closeUploadModal()">
      <div class="border-b border-border px-6 py-5">
        <p class="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">Nuevo asset</p>
        <h2 class="mt-2 font-display text-2xl text-text">Preparar subida</h2>
        <p class="mt-2 text-sm leading-6 text-text-muted">
          Define la marca antes de guardar para que el asset llegue al etiquetado IA con el contexto correcto.
        </p>
      </div>

      <div class="space-y-5 overflow-y-auto px-6 py-6">

        <!-- File area: preview or dropzone -->
        <div>
          <!-- Preview when file is selected -->
          <div
            v-if="selectedUploadFile && filePreviewUrl"
            class="group relative overflow-hidden rounded-xl border border-border bg-surface-2"
          >
            <img
              :src="filePreviewUrl"
              :alt="selectedUploadFile.name"
              class="h-44 w-full object-cover"
            >
            <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
              <label
                class="cursor-pointer rounded-lg border border-white/30 bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-sm transition hover:bg-black/70"
                :class="{ 'pointer-events-none opacity-60': uploading }"
              >
                <input ref="fileInputRef" class="hidden" type="file" accept="image/*" :disabled="uploading" @change="onFileChange">
                Cambiar archivo
              </label>
            </div>
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-6">
              <p class="truncate font-mono text-xs text-white/80">{{ selectedUploadFile.name }}</p>
              <p class="font-mono text-[10px] text-white/50">{{ formatFileSize(selectedUploadFile.size) }}</p>
            </div>
          </div>

          <!-- Dropzone when no file -->
          <section
            v-else
            class="rounded-xl border border-dashed transition"
            :class="isDragging ? 'border-accent bg-accent/5' : 'border-border bg-surface-2/40'"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
          >
            <div class="flex flex-col items-center gap-4 px-6 py-10 text-center">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-xl transition"
                :class="isDragging ? 'bg-accent/20 text-accent' : 'bg-surface text-text-muted'"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              </div>
              <div>
                <p class="text-sm text-text">
                  {{ isDragging ? 'Suelta el archivo aqui' : 'Arrastra una imagen o selecciona un archivo' }}
                </p>
                <p class="mt-1 text-xs text-text-muted">JPG, PNG, WebP o GIF</p>
              </div>
              <label
                class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-muted transition hover:border-accent/40 hover:text-text"
                :class="{ 'pointer-events-none opacity-60': uploading }"
              >
                <input ref="fileInputRef" class="hidden" type="file" accept="image/*" :disabled="uploading" @change="onFileChange">
                Elegir archivo
              </label>
            </div>
          </section>
        </div>

        <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
          <label class="block text-xs font-medium text-text-muted">
            Nombre
            <AppInput
              v-model="uploadName"
              class="mt-1.5"
              type="text"
              placeholder="Ej. Packshot botella frontal"
            />
          </label>

          <label class="block text-xs font-medium text-text-muted">
            Marca
            <AppSelect v-model="uploadBrandId" class="mt-1.5">
              <option value="">Global</option>
              <option v-for="brand in brandOptions" :key="brand.id" :value="String(brand.id)">
                {{ brand.name }}
              </option>
            </AppSelect>
          </label>
        </div>

        <div
          v-if="uploadModalError"
          class="rounded-lg border border-danger/30 bg-danger/8 px-3 py-2.5 text-sm text-danger"
        >
          {{ uploadModalError }}
        </div>

      </div>

      <div class="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
        <button
          type="button"
          class="rounded-lg border border-border px-4 py-2.5 text-sm text-text-muted transition hover:border-accent/30 hover:text-text disabled:opacity-50"
          :disabled="uploading"
          @click="closeUploadModal()"
        >
          Cancelar
        </button>
        <AppButton :disabled="uploading || !selectedUploadFile" @click="submitUpload()">
          {{ uploading ? 'Subiendo...' : 'Subir asset' }}
        </AppButton>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { AssetRecord, AssetsResponse } from '../../shared/types/assets'
import type { BrandOption } from '../../shared/types/brands'

import AppButton from '~/components/base/AppButton.vue'
import AppInput from '~/components/base/AppInput.vue'
import AppModal from '~/components/base/AppModal.vue'
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
const selectedUploadFile = ref<File | null>(null)
const uploading = ref(false)
const isDragging = ref(false)
const isUploadModalOpen = ref(false)
const uploadModalError = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const assetActionId = ref<number | null>(null)
const confirmDeleteId = ref<number | null>(null)

// Notification bar
const notification = reactive<{ message: string; tone: 'success' | 'error' }>({
  message: '',
  tone: 'success',
})
let notificationTimer: ReturnType<typeof setTimeout> | null = null

function showNotification(message: string, tone: 'success' | 'error' = 'success') {
  if (notificationTimer !== null) {
    clearTimeout(notificationTimer)
  }
  notification.message = message
  notification.tone = tone
  notificationTimer = setTimeout(() => {
    notification.message = ''
    notificationTimer = null
  }, 5000)
}

function clearNotification() {
  if (notificationTimer !== null) {
    clearTimeout(notificationTimer)
    notificationTimer = null
  }
  notification.message = ''
}

onUnmounted(() => {
  if (notificationTimer !== null) {
    clearTimeout(notificationTimer)
  }
  if (filePreviewUrl.value) {
    URL.revokeObjectURL(filePreviewUrl.value)
  }
})

// File preview URL — create/revoke object URL reactively
const filePreviewUrl = ref<string | null>(null)

watch(selectedUploadFile, (newFile) => {
  if (filePreviewUrl.value) {
    URL.revokeObjectURL(filePreviewUrl.value)
    filePreviewUrl.value = null
  }
  if (newFile) {
    filePreviewUrl.value = URL.createObjectURL(newFile)
  }
})

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

function openUploadModal() {
  resetUploadForm()
  isUploadModalOpen.value = true
  uploadModalError.value = ''
}

function resetUploadForm() {
  uploadName.value = ''
  uploadBrandId.value = ''
  selectedUploadFile.value = null
  uploadModalError.value = ''

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function closeUploadModal() {
  if (uploading.value) return
  isUploadModalOpen.value = false
  isDragging.value = false
  resetUploadForm()
}

function setUploadFile(file: File) {
  selectedUploadFile.value = file
  uploadModalError.value = ''

  if (!uploadName.value.trim()) {
    uploadName.value = prettifyFilename(file.name)
  }
}

async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', uploadName.value.trim() || prettifyFilename(file.name))

  if (uploadBrandId.value) {
    formData.append('brandId', uploadBrandId.value)
  }

  uploading.value = true

  try {
    const response = await $fetch<{ asset: AssetRecord, duplicate: boolean }>('/api/assets', {
      method: 'POST',
      body: formData,
    })

    isUploadModalOpen.value = false
    isDragging.value = false
    resetUploadForm()
    await refresh()

    showNotification(
      response.duplicate
        ? 'Ese asset ya existia. Se reutilizo la version guardada y se actualizo su marca si hacia falta.'
        : 'Asset subido correctamente.',
      'success'
    )
  }
  catch (error) {
    uploadModalError.value = getErrorMessage(error)
  }
  finally {
    uploading.value = false
  }
}

async function submitUpload() {
  if (!selectedUploadFile.value) {
    uploadModalError.value = 'Selecciona un archivo antes de subirlo.'
    return
  }

  await uploadFile(selectedUploadFile.value)
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]

  if (file && file.type.startsWith('image/')) {
    setUploadFile(file)
  } else if (file) {
    uploadModalError.value = 'Solo se permiten archivos de imagen.'
  }
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]

  if (file && file.type.startsWith('image/')) {
    setUploadFile(file)
  } else if (file) {
    uploadModalError.value = 'Solo se permiten archivos de imagen.'
  }
}

function assetBrandSelection(asset: AssetRecord) {
  return asset.brandId === null ? '' : String(asset.brandId)
}

async function updateAssetBrand(asset: AssetRecord, value: string | number) {
  const nextBrandId = String(value || '').trim()
  const parsedBrandId = nextBrandId ? Number(nextBrandId) : null

  if (parsedBrandId === asset.brandId) return

  assetActionId.value = asset.id

  try {
    await $fetch(`/api/assets/${asset.id}`, {
      method: 'PUT',
      body: { brandId: parsedBrandId },
    })

    await refresh()
    showNotification(`Marca actualizada para ${asset.name}.`, 'success')
  }
  catch (error) {
    showNotification(getErrorMessage(error), 'error')
  }
  finally {
    assetActionId.value = null
  }
}

async function removeAsset(asset: AssetRecord) {
  assetActionId.value = asset.id

  try {
    await $fetch(`/api/assets/${asset.id}`, {
      method: 'DELETE',
    })

    confirmDeleteId.value = null
    await refresh()
    showNotification(`Asset eliminado: ${asset.name}.`, 'success')
  }
  catch (error) {
    confirmDeleteId.value = null
    showNotification(getErrorMessage(error), 'error')
  }
  finally {
    assetActionId.value = null
  }
}

function getErrorMessage(error: unknown): string {
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

  return 'No se pudo completar la accion sobre el asset.'
}
</script>

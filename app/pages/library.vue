<template>
  <div class="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
    <div class="mx-auto max-w-7xl">
      <!-- Header -->
      <header class="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Biblioteca</p>
          <h1 class="mt-3 font-display text-3xl text-text">Imagenes generadas</h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-text-muted">
            Todo lo que sale del estudio termina aqui, organizado por proyecto. Selecciona cualquier imagen para ver su historial y volver a iterar.
          </p>
        </div>

        <div class="flex items-center gap-3 text-xs text-text-muted">
          <span v-if="images.length">{{ images.length }} {{ images.length === 1 ? 'imagen' : 'imagenes' }}</span>
          <span v-if="totalVersions" class="text-text-muted/50">/</span>
          <span v-if="totalVersions">{{ totalVersions }} versiones</span>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="pending" class="rounded-xl border border-border bg-surface px-6 py-10 text-center text-sm text-text-muted">
        Cargando biblioteca...
      </div>

      <!-- Error -->
      <div v-else-if="errorMessage" class="rounded-xl border border-danger/40 bg-danger/10 px-6 py-8 text-sm text-danger">
        {{ errorMessage }}
      </div>

      <!-- Empty state -->
      <div v-else-if="!folders.length" class="rounded-xl border border-dashed border-border bg-surface px-8 py-16 text-center">
        <div class="mx-auto max-w-sm">
          <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2">
            <svg class="h-6 w-6 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 17a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.9a2 2 0 0 1-1.69-.9l-.81-1.2a2 2 0 0 0-1.67-.9H8a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z" /><path d="M2 8v11a2 2 0 0 0 2 2h14" /></svg>
          </div>
          <h2 class="font-display text-xl text-text">Sin imagenes todavia</h2>
          <p class="mt-3 text-sm leading-6 text-text-muted">
            Cuando generes conceptos o finales desde el estudio, apareceran aqui dentro de la carpeta del proyecto.
          </p>
          <NuxtLink
            to="/studio"
            class="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-90"
          >
            Ir al estudio
          </NuxtLink>
        </div>
      </div>

      <!-- Main content -->
      <div v-else>
        <!-- Toolbar -->
        <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="flex flex-1 flex-wrap items-center gap-2">
            <button
              type="button"
              class="rounded-lg border px-3 py-2 text-sm transition"
              :class="selectedFolderSlug === 'all' ? 'border-accent/40 bg-accent/10 text-text' : 'border-border text-text-muted hover:border-accent/20 hover:text-text'"
              @click="selectedFolderSlug = 'all'"
            >
              Todas
            </button>

            <button
              v-for="folder in folders"
              :key="folder.id"
              type="button"
              class="rounded-lg border px-3 py-2 text-sm transition"
              :class="selectedFolderSlug === folder.projectSlug ? 'border-accent/40 bg-accent/10 text-text' : 'border-border text-text-muted hover:border-accent/20 hover:text-text'"
              @click="selectedFolderSlug = folder.projectSlug"
            >
              {{ folder.name }}
              <span class="ml-1 text-text-muted">{{ folder.imageCount }}</span>
            </button>
          </div>

          <div class="flex items-center gap-2">
            <label class="relative block">
              <span class="sr-only">Buscar</span>
              <input
                v-model="searchQuery"
                type="search"
                placeholder="Buscar..."
                class="w-full rounded-lg border border-border bg-bg px-3 py-2 pr-9 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent sm:w-52"
              >
              <svg class="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            </label>

            <select
              v-model="sortMode"
              class="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
            >
              <option value="recent">Recientes</option>
              <option value="versions">Mas iteradas</option>
              <option value="project">Proyecto</option>
            </select>
          </div>
        </div>

        <!-- Collection chips -->
        <div v-if="collections.length" class="mb-6 flex flex-wrap items-center gap-2">
          <span class="text-xs text-text-muted">Filtrar:</span>
          <button
            v-for="collection in collections"
            :key="collection.id"
            type="button"
            class="rounded-full border px-2.5 py-1 text-[11px] transition"
            :class="selectedCollectionId === collection.id ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border text-text-muted hover:border-accent/20 hover:text-text'"
            @click="selectedCollectionId = selectedCollectionId === collection.id ? null : collection.id"
          >
            {{ collection.name }}
          </button>

          <button
            v-if="selectedCollectionId"
            type="button"
            class="text-[11px] text-text-muted transition hover:text-text"
            @click="selectedCollectionId = null"
          >
            Limpiar
          </button>
        </div>

        <!-- Image grid -->
        <div v-if="!filteredImages.length" class="rounded-xl border border-border bg-surface px-6 py-14 text-center text-sm text-text-muted">
          Sin resultados para este filtro.
        </div>

        <div v-else class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <button
            v-for="image in filteredImages"
            :key="image.id"
            type="button"
            class="group overflow-hidden rounded-xl border text-left transition"
            :class="selectedImageId === image.id ? 'border-accent/50 ring-1 ring-accent/20' : 'border-border hover:border-accent/30'"
            @click="openDetail(image)"
          >
            <div class="relative aspect-square overflow-hidden bg-surface-2">
              <img
                v-if="currentVersion(image)?.imageUrl"
                :src="currentVersion(image)?.imageUrl"
                :alt="image.name"
                class="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
              >
              <div v-else class="flex h-full items-center justify-center text-xs text-text-muted">
                Sin imagen
              </div>

              <!-- Minimal overlay -->
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8">
                <p class="truncate text-sm text-white">{{ image.conceptTitle }}</p>
                <div class="mt-1 flex items-center gap-1.5 text-[10px] text-white/60">
                  <span>{{ image.ratio }}</span>
                  <span
                    class="rounded px-1 py-0.5 text-[9px] uppercase tracking-wider"
                    :class="image.approvedAt ? 'bg-accent/30 text-white/90' : 'bg-white/10'"
                  >
                    {{ image.approvedAt ? 'final' : 'preview' }}
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>

        <LibraryImageDetailModal
          :image="selectedImage"
          :selected-version="selectedVersion"
          :selected-version-id="selectedVersionId"
          :studio-link="selectedImage ? studioLink(selectedImage) : '/library'"
          @close="closeDetail"
          @select-version="selectedVersionId = $event"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LibraryImageItem, LibraryImageVersion, LibraryResponse } from '../../shared/types/studio'

import LibraryImageDetailModal from '~/components/library/LibraryImageDetailModal.vue'

const pending = ref(true)
const errorMessage = ref('')
const folders = ref<LibraryResponse['folders']>([])
const collections = ref<LibraryResponse['collections']>([])
const images = ref<LibraryImageItem[]>([])
const selectedFolderSlug = ref<string>('all')
const selectedCollectionId = ref<string | null>(null)
const selectedImageId = ref<string | null>(null)
const selectedVersionId = ref<string | null>(null)
const searchQuery = ref('')
const sortMode = ref<'recent' | 'versions' | 'project'>('recent')

await loadLibrary()

async function loadLibrary() {
  pending.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch<LibraryResponse>('/api/library')
    folders.value = response.folders
    collections.value = response.collections
    images.value = response.images
  }
  catch {
    errorMessage.value = 'No pudimos cargar la biblioteca en este momento.'
  }
  finally {
    pending.value = false
  }
}

const totalVersions = computed(() => {
  return images.value.reduce((total, image) => total + image.versions.length, 0)
})

const filteredImages = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  const filtered = images.value.filter((image) => {
    const matchesFolder = selectedFolderSlug.value === 'all' || image.projectSlug === selectedFolderSlug.value
    const matchesCollection = !selectedCollectionId.value || image.collectionKeys.includes(selectedCollectionId.value)
    const matchesSearch = !query || [
      image.projectName,
      image.conceptTitle,
      image.conceptSubtitle,
      image.name,
      ...image.versions.map((version) => version.prompt)
    ].join(' ').toLowerCase().includes(query)

    return matchesFolder && matchesCollection && matchesSearch
  })

  return filtered.sort((left, right) => {
    if (sortMode.value === 'versions') {
      return right.versions.length - left.versions.length || compareDatesDesc(left.updatedAt, right.updatedAt)
    }

    if (sortMode.value === 'project') {
      return left.projectName.localeCompare(right.projectName) || left.name.localeCompare(right.name)
    }

    return compareDatesDesc(left.updatedAt, right.updatedAt)
  })
})

watch(filteredImages, (nextImages) => {
  if (!nextImages.length) {
    selectedImageId.value = null
    selectedVersionId.value = null
    return
  }

  const stillVisible = nextImages.find((image) => image.id === selectedImageId.value)

  if (!stillVisible) {
    selectedImageId.value = null
    selectedVersionId.value = null
  }
})

const selectedImage = computed(() => {
  return images.value.find((image) => image.id === selectedImageId.value) || null
})

const selectedVersion = computed(() => {
  if (!selectedImage.value) {
    return null
  }

  return selectedImage.value.versions.find((version) => version.id === selectedVersionId.value) || selectedImage.value.versions[0] || null
})

function currentVersion(image: LibraryImageItem): LibraryImageVersion | undefined {
  return image.versions.find((version) => version.id === image.currentVersionId) || image.versions[0]
}

function openDetail(image: LibraryImageItem) {
  selectedImageId.value = image.id
  selectedVersionId.value = image.currentVersionId
}

function closeDetail() {
  selectedImageId.value = null
  selectedVersionId.value = null
}

function compareDatesDesc(left: string, right: string) {
  return new Date(right).getTime() - new Date(left).getTime()
}

function studioLink(image: LibraryImageItem) {
  return `/studio/${image.projectSlug}/concepts?concept=${encodeURIComponent(image.conceptId)}&ratio=${encodeURIComponent(image.ratio)}&variant=${encodeURIComponent(selectedVersionId.value || image.currentVersionId)}`
}
</script>

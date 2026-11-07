<template>
  <AppModal :open="Boolean(image)" label="Detalle de imagen" size="4xl" @close="$emit('close')">
    <template v-if="image">
      <header class="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 class="text-sm font-medium">Detalle de imagen</h2>
        <button type="button" aria-label="Cerrar detalle de imagen" class="rounded-lg border border-border px-4 py-2" @click="$emit('close')">×</button>
      </header>
      <div class="flex min-h-0 flex-1 flex-col overflow-y-auto sm:flex-row">
        <div class="flex shrink-0 items-center justify-center bg-bg p-3 sm:w-[55%]">
          <img v-if="selectedVersion?.imageUrl" :src="selectedVersion.imageUrl" :alt="image.name" class="max-h-[40dvh] w-full object-contain sm:max-h-[65dvh]">
          <p v-else class="py-16 text-sm text-text-muted">Sin imagen</p>
        </div>
        <div class="min-w-0 flex-1 p-4 sm:overflow-y-auto">
          <p class="text-xs text-text-muted">{{ image.projectName }} · {{ image.ratio }}</p>
          <h3 class="mt-2 font-display text-xl">{{ image.conceptTitle }}</h3>
          <p class="mt-2 text-sm text-text-muted">{{ image.conceptSubtitle }}</p>
          <nav aria-label="Información de imagen" class="my-4 flex gap-2">
            <button type="button" :aria-pressed="tab === 'versions'" class="flex-1 rounded-lg border px-2 text-sm" :class="tab === 'versions' ? 'border-accent text-accent' : 'border-border'" @click="tab = 'versions'">Versiones · {{ image.versions.length }}</button>
            <button type="button" :aria-pressed="tab === 'prompt'" class="flex-1 rounded-lg border px-2 text-sm" :class="tab === 'prompt' ? 'border-accent text-accent' : 'border-border'" @click="tab = 'prompt'">Prompt</button>
          </nav>
          <div v-if="tab === 'versions'" class="space-y-2">
            <button v-for="version in image.versions" :key="version.id" type="button" class="w-full rounded-lg border px-3 py-3 text-left" :aria-pressed="selectedVersionId === version.id" :class="selectedVersionId === version.id ? 'border-accent bg-accent/10' : 'border-border'" @click="$emit('select-version', version.id)">
              <span class="flex justify-between gap-2 text-sm"><span>{{ version.label }}</span><span class="text-xs text-accent">{{ version.mode === 'final' ? 'Arte final' : 'Preview' }}</span></span>
              <span class="mt-1 block text-xs text-text-muted">{{ formatTimestamp(version.createdAt) }}</span>
            </button>
          </div>
          <div v-else class="space-y-3">
            <p class="text-xs text-text-muted">{{ selectedVersion?.label }} · {{ formatTimestamp(selectedVersion?.createdAt || image.updatedAt) }}</p>
            <p class="whitespace-pre-wrap break-words font-mono text-sm leading-6 text-text-muted">{{ selectedVersion?.prompt || 'Sin prompt.' }}</p>
          </div>
        </div>
      </div>
      <footer class="mobile-safe-footer flex shrink-0 flex-wrap gap-3 border-t border-border px-4 py-3">
        <NuxtLink :to="studioLink" class="flex min-h-12 flex-1 items-center justify-center rounded-lg border border-border px-3 text-center text-sm">Abrir en estudio</NuxtLink>
        <a v-if="selectedVersion?.imageUrl" :href="selectedVersion.imageUrl" :download="`${image.conceptTitle}-${image.ratio.replace(':', 'x')}.png`" class="flex min-h-12 flex-1 items-center justify-center rounded-lg bg-accent px-3 text-sm font-medium text-bg">Descargar ↓</a>
      </footer>
    </template>
  </AppModal>
</template>
<script setup lang="ts">
import AppModal from '~/components/base/AppModal.vue'
const tab = ref('versions')
import type { LibraryImageItem, LibraryImageVersion } from '../../../shared/types/studio'

const props = defineProps<{
  image: LibraryImageItem | null
  selectedVersion: LibraryImageVersion | null
  selectedVersionId: string | null
  studioLink: string
}>()

defineEmits<{
  close: []
  'select-version': [versionId: string]
}>()

watch(() => props.image?.id, () => { tab.value = 'versions' })

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}
</script>

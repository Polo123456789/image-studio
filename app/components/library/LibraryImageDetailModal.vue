<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="image"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
        @click.self="$emit('close')"
      >
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          leave-active-class="transition-all duration-150 ease-in"
          enter-from-class="scale-95 opacity-0"
          leave-to-class="scale-95 opacity-0"
          appear
        >
          <div class="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg sm:flex-row">
            <div class="relative shrink-0 bg-[#0a0a0a] sm:w-[55%]">
              <div class="flex h-full items-center justify-center p-4 sm:p-5">
                <img
                  v-if="selectedVersion?.imageUrl"
                  :src="selectedVersion.imageUrl"
                  :alt="image.name"
                  class="max-h-[35vh] w-full rounded-lg object-contain sm:max-h-[78vh]"
                >
                <div v-else class="flex h-64 items-center justify-center text-sm text-text-muted">
                  Sin imagen
                </div>
              </div>

              <span
                class="absolute top-4 left-4 rounded px-2 py-1 text-[10px] uppercase tracking-wider sm:top-5 sm:left-5"
                :class="image.approvedAt ? 'bg-accent/20 text-accent' : 'bg-white/10 text-white/60'"
              >
                {{ image.approvedAt ? 'Final' : 'Preview' }}
              </span>
            </div>

            <div class="flex min-h-0 flex-1 flex-col border-t border-border sm:border-t-0 sm:border-l">
              <div class="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                <div class="min-w-0">
                  <h3 class="truncate text-sm font-medium text-text">{{ image.conceptTitle }}</h3>
                  <p class="mt-1 text-xs leading-5 text-text-muted">{{ image.conceptSubtitle }}</p>
                  <div class="mt-2 flex items-center gap-2 text-[11px] text-text-muted">
                    <span>{{ image.projectName }}</span>
                    <span class="text-border">&middot;</span>
                    <span class="font-mono">{{ image.ratio }}</span>
                    <span class="text-border">&middot;</span>
                    <span>{{ image.versions.length }} {{ image.versions.length === 1 ? 'version' : 'versiones' }}</span>
                  </div>
                </div>

                <button
                  type="button"
                  class="shrink-0 rounded border border-border p-1.5 text-text-muted transition hover:border-text-muted hover:text-text"
                  @click="$emit('close')"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div class="flex-1 overflow-y-auto">
                <div class="border-b border-border px-5 py-4">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-xs font-medium text-text">Prompt</p>
                    <span
                      class="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em]"
                      :class="selectedVersion?.mode === 'final' ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-text-muted'"
                    >
                      {{ selectedVersion?.mode }}
                    </span>
                  </div>
                  <p class="mt-1.5 text-[11px] text-text-muted">{{ formatTimestamp(selectedVersion?.createdAt || image.updatedAt) }}</p>
                  <p class="mt-2.5 max-h-28 overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-5 text-text-muted">
                    {{ selectedVersion?.prompt || 'Sin prompt.' }}
                  </p>
                </div>

                <div class="px-5 py-4">
                  <p class="text-xs font-medium text-text">Historial</p>

                  <div class="mt-3 space-y-1">
                    <button
                      v-for="version in image.versions"
                      :key="version.id"
                      type="button"
                      class="w-full rounded-lg border px-3 py-2 text-left transition"
                      :class="selectedVersionId === version.id ? 'border-accent/40 bg-accent/8' : 'border-border hover:border-accent/20'"
                      @click="$emit('select-version', version.id)"
                    >
                      <div class="flex items-center justify-between gap-2">
                        <span class="truncate text-xs text-text">{{ version.label }}</span>
                        <span
                          class="shrink-0 font-mono text-[10px]"
                          :class="version.mode === 'final' ? 'text-accent' : 'text-text-muted'"
                        >
                          {{ version.mode }}
                        </span>
                      </div>
                      <p class="mt-0.5 text-[11px] text-text-muted">{{ formatTimestamp(version.createdAt) }}</p>
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3 border-t border-border px-5 py-4">
                <NuxtLink
                  :to="studioLink"
                  class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-bg transition hover:opacity-90"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.855z" /></svg>
                  Seguir iterando
                </NuxtLink>

                <button
                  type="button"
                  class="rounded-lg border border-border px-4 py-2.5 text-sm text-text-muted transition hover:border-text-muted hover:text-text"
                  @click="$emit('close')"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { LibraryImageItem, LibraryImageVersion } from '../../../shared/types/studio'

defineProps<{
  image: LibraryImageItem | null
  selectedVersion: LibraryImageVersion | null
  selectedVersionId: string | null
  studioLink: string
}>()

defineEmits<{
  close: []
  'select-version': [versionId: string]
}>()

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}
</script>

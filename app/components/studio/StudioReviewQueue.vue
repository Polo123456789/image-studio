<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      tabindex="-1"
      aria-labelledby="review-title"
      aria-modal="true"
      class="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none border-0 bg-bg p-0 text-text backdrop:bg-black/80"
      @cancel.prevent="emit('close')"
      @keydown="onKeydown"
    >
      <div class="flex h-full flex-col">
        <header class="flex shrink-0 items-center justify-between gap-6 border-b border-border px-8 py-5">
          <div class="flex items-center gap-6">
            <button type="button" :disabled="saving" class="rounded-lg border border-border px-4 py-2.5 text-sm text-text-muted transition hover:text-text disabled:opacity-50" @click="emit('close')">← Estudio</button>
            <div>
              <p class="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">{{ projectName }}</p>
              <h1 id="review-title" class="mt-1 font-display text-2xl">Revisión de imágenes</h1>
            </div>
          </div>
          <div class="flex items-center gap-6">
            <p class="text-sm text-text-muted">{{ entries.length - pending.length }} de {{ entries.length }} revisadas · {{ pending.length }} pendientes<span v-if="regeneratingCount" class="ml-3 text-accent">· {{ regeneratingCount }} regenerando</span></p>
            <button type="button" :disabled="saving" class="rounded-lg border border-border px-4 py-2.5 text-sm transition hover:border-accent disabled:opacity-50" @click="emit('close')">Guardar y salir</button>
          </div>
        </header>
        <div class="flex shrink-0 items-center gap-4 border-b border-border px-8 py-3">
          <label for="review-scope" class="text-sm text-text-muted">Revisar</label>
          <select id="review-scope" :value="scope" :disabled="saving" class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text" @change="emit('scope', ($event.target as HTMLSelectElement).value as 'all' | 'current' | 'latest')">
            <option value="all">Todas las pendientes</option>
            <option value="current">Sólo versiones actuales</option>
            <option value="latest" :disabled="!hasLatestBatch">Última tanda con imágenes</option>
          </select>
          <span class="text-xs text-text-muted">{{ scope === 'latest' ? 'Tanda al abrir la revisión. Las nuevas imágenes se añaden al final.' : !hasLatestBatch ? 'Última tanda se habilita al recibir imágenes generadas en esta sesión.' : 'Cambiar el filtro conserva las evaluaciones.' }}</span>
        </div>
        <div class="h-1 shrink-0 bg-surface-2" role="progressbar" aria-label="Imágenes revisadas" :aria-valuenow="entries.length - pending.length" :aria-valuemax="entries.length" :aria-valuemin="0">
          <div class="h-full bg-accent transition-[width] duration-200" :style="{ width: `${entries.length ? (entries.length - pending.length) / entries.length * 100 : 0}%` }" />
        </div>

        <div v-if="current" class="grid min-h-0 flex-1 grid-cols-[180px_minmax(0,1fr)_230px] gap-7 px-8 py-7">
          <aside class="min-h-0 overflow-y-auto" aria-label="Imágenes pendientes">
            <p class="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">Cola de revisión</p>
            <p class="mt-2 text-xs text-text-muted">Sólo sin revisar</p>
            <ol class="mt-6 space-y-3">
              <li v-for="entry in queuePreview" :key="entry.key" class="border-l-2 px-3 py-3" :class="entry.key === current.key ? 'border-accent bg-accent/10' : 'border-border'" :aria-current="entry.key === current.key ? 'step' : undefined">
                <p class="text-xs" :class="entry.key === current.key ? 'text-text' : 'text-text-muted'">{{ entry.conceptTitle }}</p>
                <p class="mt-1.5 text-[11px] text-text-muted">{{ entry.ratio }} · {{ entry.variant.label }}</p>
              </li>
            </ol>
            <p v-if="available.length > queuePreview.length" class="mt-4 text-xs text-text-muted">Y {{ available.length - queuePreview.length }} más</p>
          </aside>
          <div class="relative flex min-h-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface/30 p-5">
            <img :key="current.key" :src="current.variant.imageUrl" :alt="`${current.conceptTitle}, ${current.ratio}, ${current.variant.label}`" class="h-full w-full object-contain" @error="imageFailed = true; imageReady = false" @load="imageFailed = false; imageReady = true">
            <p v-if="!imageReady && !imageFailed" role="status" class="absolute text-sm text-text-muted">Cargando imagen…</p>
          </div>
          <aside class="overflow-y-auto py-3">
            <span class="rounded border border-border px-2.5 py-1.5 font-mono text-[10px] text-accent">Sin revisar</span>
            <h2 class="mt-7 font-display text-2xl leading-tight">{{ current.conceptTitle }}</h2>
            <dl class="mt-5 space-y-3 text-sm">
              <div><dt class="text-text-muted">Concepto</dt><dd class="mt-1">{{ String(current.conceptIndex + 1).padStart(2, '0') }}</dd></div>
              <div><dt class="text-text-muted">Formato</dt><dd class="mt-1 font-mono">{{ current.ratio }}</dd></div>
              <div><dt class="text-text-muted">Versión</dt><dd class="mt-1">{{ current.variant.label }}</dd></div>
              <div><dt class="text-text-muted">Generada</dt><dd class="mt-1 text-xs">{{ formatDate(current.variant.createdAt) }}</dd></div>
            </dl>
            <div class="mt-7 border-t border-border pt-5 text-xs leading-6 text-text-muted">
              <p>Al evaluar, aparece la siguiente imagen pendiente.</p>
              <p class="mt-3">Si el diseño funciona pero tiene errores, regenera y sigue revisando. La nueva versión irá al final cuando esté lista.</p>
            </div>
            <p v-if="imageFailed" role="alert" class="mt-4 text-xs leading-5 text-danger">No se pudo cargar la imagen. Puedes dejarla para después o salir e intentarlo de nuevo.</p>
          </aside>
        </div>

        <div v-else class="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-8 py-10 text-center">
          <div>
            <p class="font-mono text-xs uppercase tracking-[0.25em] text-accent">{{ pending.length ? 'Progreso guardado' : 'Revisión completa' }}</p>
            <h2 class="mt-5 font-display text-5xl">{{ pending.length ? 'Lo retomamos después.' : 'Todo revisado.' }}</h2>
            <p class="mt-5 text-sm text-text-muted">{{ pending.length ? 'Las imágenes que dejaste para después siguen pendientes.' : 'Cada imagen tiene ahora tu evaluación.' }}</p>
            <div class="mt-9 flex justify-center gap-4">
              <div v-for="stat in stats" :key="stat.label" class="min-w-36 rounded-xl border border-border bg-surface px-7 py-5">
                <p class="font-display text-4xl" :class="stat.color">{{ stat.count }}</p><p class="mt-2 text-sm text-text-muted">{{ stat.label }}</p>
              </div>
            </div>
            <p v-if="regeneratingCount" role="status" class="mt-6 text-sm text-accent">{{ regeneratingCount }} {{ regeneratingCount === 1 ? 'imagen sigue regenerándose' : 'imágenes siguen regenerándose' }}. Las nuevas versiones quedarán en pendientes cuando estén listas.</p>
            <div class="mt-8 flex justify-center gap-3">
              <button v-if="pending.length" type="button" class="rounded-lg border border-accent bg-accent/10 px-5 py-3 text-sm text-accent" @click="emit('resume')">Retomar pendientes</button>
              <button type="button" class="rounded-lg border border-border px-5 py-3 text-sm transition hover:border-accent" @click="emit('close')">Volver al estudio</button>
            </div>
            <p class="mt-7 text-xs text-text-muted">Las evaluaciones se guardan. Las imágenes permanecen en el proyecto.</p>
          </div>
        </div>

        <div v-if="error" role="alert" class="mx-8 mb-4 rounded-lg border border-danger/40 bg-danger/10 px-5 py-3 text-sm text-danger">{{ error }}</div>
        <StudioRegenerationTray review :disabled="saving" @navigate="emit('close')" />
        <footer class="flex min-h-24 shrink-0 items-center justify-between gap-5 border-t border-border bg-surface px-8 py-5">
          <div class="flex items-center gap-5">
            <button type="button" :disabled="saving || !canUndo" class="rounded-lg border border-border px-4 py-2.5 text-sm transition hover:border-accent disabled:opacity-40" @click="emit('undo')">↶ Deshacer</button>
            <p role="status" aria-live="polite" class="max-w-[240px] text-xs text-text-muted">{{ saving ? 'Guardando evaluación…' : message || 'Se guarda al evaluar · Ctrl / ⌘ Z para deshacer' }}</p>
          </div>
          <div v-if="current" class="flex items-center gap-4">
            <button type="button" :disabled="saving" class="rounded-lg border border-border px-4 py-2.5 text-sm text-text-muted transition hover:text-text disabled:opacity-40" @click="emit('skip')">Después <kbd class="ml-4 text-[10px]">ESPACIO</kbd></button>
            <StudioReviewControls :disabled="saving || !imageReady" shortcuts regenerate :regenerate-disabled="!canRegenerate" @regenerate="emit('regenerate')" @rate="emit('rate', $event)" />
          </div>
        </footer>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import type { StudioReviewEntry } from '../../utils/studio-review'
import type { StudioReviewRating } from '../../../shared/types/studio'
import StudioReviewControls from './StudioReviewControls.vue'
import StudioRegenerationTray from './StudioRegenerationTray.vue'
const props = defineProps<{
  scope: 'all' | 'current' | 'latest'
  hasLatestBatch: boolean
  projectName: string
  entries: StudioReviewEntry[]
  pending: StudioReviewEntry[]
  available: StudioReviewEntry[]
  current?: StudioReviewEntry
  saving: boolean
  error: string
  message: string
  canUndo: boolean
  regeneratingCount: number
  canRegenerate: boolean
}>()
const emit = defineEmits<{
  scope: [scope: 'all' | 'current' | 'latest']
  close: []
  resume: []
  rate: [rating: Exclude<StudioReviewRating, null>]
  skip: []
  undo: []
  regenerate: []
}>()
const dialog = ref<HTMLDialogElement | null>(null)
const imageFailed = ref(false)
const imageReady = ref(false)
const queuePreview = computed(() => props.current
  ? [props.current, ...props.available.filter(entry => entry.key !== props.current?.key)].slice(0, 5)
  : [])
const stats = computed(() => [
  { label: 'Buenas', count: props.entries.filter(entry => entry.variant.reviewRating === 'good').length, color: 'text-accent' },
  { label: 'Malas', count: props.entries.filter(entry => entry.variant.reviewRating === 'bad').length, color: 'text-danger' },
  { label: 'Pendientes', count: props.pending.length, color: 'text-text' }
])
watch(() => props.current?.key, async () => {
  imageFailed.value = false
  imageReady.value = false
  await nextTick()
  dialog.value?.focus()
})
watch(() => props.saving, async (saving, wasSaving) => {
  if (!saving && wasSaving) {
    await nextTick()
    if (!dialog.value?.contains(document.activeElement)) dialog.value?.focus()
  }
})
function formatDate(value: string) {
  return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
function onKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.repeat || props.saving) return
  const target = event.target as HTMLElement
  if (target.closest('input, textarea, select, [contenteditable="true"]')) return
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
    event.preventDefault()
    emit('undo')
    return
  }
  if (event.ctrlKey || event.metaKey || event.altKey || !props.current) return
  if (event.key.toLowerCase() === 'r' && props.canRegenerate && imageReady.value) {
    event.preventDefault()
    emit('regenerate')
  } else if (['ArrowLeft', 'ArrowRight'].includes(event.key) && imageReady.value) {
    event.preventDefault()
    emit('rate', event.key === 'ArrowRight' ? 'good' : 'bad')
  } else if (event.code === 'Space' && !target.closest('button, a')) {
    event.preventDefault()
    emit('skip')
  }
}
let previousOverflow = ''
onMounted(() => {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  dialog.value?.showModal()
  // Keep Space available for deferring an image, without overriding button activation.
  dialog.value?.focus()
})
onBeforeUnmount(() => {
  dialog.value?.close()
  document.body.style.overflow = previousOverflow
})
</script>

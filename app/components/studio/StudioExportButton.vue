<template>
  <div ref="control" class="relative shrink-0" @keydown.esc.stop.prevent="closeMenu(true)">
    <div class="inline-flex">
      <button type="button" class="rounded-l bg-accent px-4 py-2.5 text-sm font-medium text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50" :disabled="disabled || loading || !counts.good" :aria-describedby="noGoodImages ? 'export-no-good-images' : undefined" :title="noGoodImages ? 'No hay imágenes buenas para exportar' : hasReviews ? 'Exportar sólo imágenes buenas de versiones activas' : 'Sin evaluaciones: exportar todos los artes activos'" @click="exportScope('good')">
        {{ loading ? 'Preparando ZIP...' : hasReviews ? 'Exportar buenas' : 'Exportar ZIP' }}
      </button>
      <button ref="toggle" type="button" class="flex items-center justify-center rounded-r border-l border-bg/20 bg-accent px-3 text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Opciones de exportación ZIP" :aria-expanded="open" aria-controls="export-options" :aria-describedby="noGoodImages ? 'export-no-good-images' : undefined" :disabled="disabled || loading || !counts.all" @click="open = !open">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 8 5 5 5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
    </div>
    <p v-if="noGoodImages" id="export-no-good-images" role="status" class="mt-2 max-w-72 text-xs leading-5 text-text-muted">No hay imágenes buenas para exportar. Usa el desplegable para elegir otras versiones activas.</p>
    <div v-if="open" id="export-options" class="absolute right-0 top-full z-20 mt-2 w-72 max-w-[85vw] rounded-lg border border-border bg-surface-2 p-1.5 shadow-lg">
      <p class="mx-2 mb-1 border-b border-border pb-2 pt-1 text-[11px] leading-4 text-text-muted">Sólo versiones activas de artes finales. {{ hasReviews ? '' : 'Sin evaluaciones: se exportan todas.' }}</p>
      <button v-for="option in options" :key="option.scope" type="button" :disabled="!counts[option.scope]" class="flex w-full items-center justify-between gap-3 rounded px-3 py-2.5 text-left text-sm text-text transition hover:bg-surface focus-visible:bg-surface disabled:cursor-not-allowed disabled:opacity-40" @click="exportScope(option.scope)">
        <span>{{ option.label }}<span v-if="option.scope === 'mixed'" class="mt-1 block text-[11px] leading-4 text-text-muted">Incluye malas y sin evaluar de los mixtos</span></span>
        <span class="font-mono text-xs text-text-muted">{{ counts[option.scope] }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StudioExportScope } from '#shared/studio-export'
const props = defineProps<{ counts: Record<StudioExportScope, number>; hasReviews: boolean; loading: boolean; disabled: boolean }>()
const noGoodImages = computed(() => props.hasReviews && props.counts.all > 0 && props.counts.good === 0)
const emit = defineEmits<{ export: [scope: StudioExportScope] }>()
const control = ref<HTMLElement | null>(null)
const toggle = ref<HTMLButtonElement | null>(null)
const open = ref(false)
const options: { scope: StudioExportScope; label: string }[] = [
  { scope: 'good', label: 'Sólo buenas' },
  { scope: 'mixed', label: 'Buenas + conceptos mixtos' },
  { scope: 'all', label: 'Todas las activas' }
]
function closeMenu(restoreFocus = false) {
  open.value = false
  if (restoreFocus) toggle.value?.focus()
}
function exportScope(scope: StudioExportScope) {
  if (props.disabled || props.loading || !props.counts[scope]) return
  closeMenu()
  emit('export', scope)
}
function onOutside(event: Event) {
  if (event.target instanceof Node && !control.value?.contains(event.target)) closeMenu()
}
watch(() => [props.loading, props.disabled], () => closeMenu())
onMounted(() => {
  document.addEventListener('pointerdown', onOutside)
  document.addEventListener('focusin', onOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutside)
  document.removeEventListener('focusin', onOutside)
})
</script>

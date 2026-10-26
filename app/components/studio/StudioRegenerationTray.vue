<template>
  <div v-if="regenerationTasks.length" ref="root" class="fixed left-8 z-40 text-text" :class="review ? 'bottom-28' : 'bottom-7'" @keydown="onTrayKeydown">
    <section v-if="open" :id="panelId" role="region" aria-label="Regeneraciones de esta sesión" class="mb-3 flex max-h-[min(590px,calc(100dvh-220px))] w-[390px] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
      <header class="flex items-center justify-between px-5 pt-5">
        <h2 class="font-display text-xl">Regeneraciones</h2>
        <button type="button" aria-label="Cerrar bandeja" class="rounded px-2 py-1 text-text-muted hover:text-text" @click="close">×</button>
      </header>
      <p class="px-5 pt-2 text-xs text-text-muted">Actividad de esta sesión de trabajo</p>
      <div class="flex gap-1 border-b border-border px-4 py-3" role="group" aria-label="Filtrar regeneraciones">
        <button v-for="tab in tabs" :key="tab.value" type="button" :aria-pressed="filter === tab.value" class="rounded-md px-2 py-2 text-xs transition" :class="filter === tab.value ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-text'" @click="filter = tab.value">{{ tab.label }} {{ tab.count }}</button>
      </div>
      <ul class="min-h-0 overflow-y-auto px-5">
        <li v-for="task in visibleTasks" :key="task.id" class="border-b border-border py-4 last:border-0">
          <button type="button" :disabled="disabled" class="flex w-full items-start gap-3 rounded-md text-left outline-offset-4 disabled:opacity-50" @click="visit(task)">
            <img v-if="task.thumbnailUrl" :src="task.thumbnailUrl" alt="" class="h-12 w-12 rounded object-cover">
            <span v-else class="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-surface-2 text-accent" :class="task.status === 'running' ? 'animate-pulse' : ''" aria-hidden="true">↻</span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm">{{ task.conceptTitle }}</span>
              <span class="mt-1 block truncate text-[11px] text-text-muted">{{ task.projectName }} · {{ task.request.ratio }}</span>
              <span class="mt-1 block text-xs" :class="task.status === 'error' ? 'text-danger' : 'text-accent'">{{ task.status === 'running' ? 'Generando · Ver en el estudio' : task.status === 'ready' ? 'Lista · Ver esta versión' : 'No se pudo generar · Ver original' }}</span>
            </span>
          </button>
          <div v-if="task.status === 'running'" class="mt-3 h-1 overflow-hidden rounded-full bg-surface-2" aria-label="Generación en curso"><div class="h-full w-1/3 animate-pulse rounded-full bg-accent/70" /></div>
          <template v-if="task.status === 'error'">
            <p class="mt-2 break-words text-xs leading-5 text-danger">{{ task.error }}</p>
            <button type="button" :disabled="disabled || busy(task)" class="mt-3 rounded-lg border border-accent/40 px-3 py-2 text-xs text-accent disabled:opacity-40" @click="visit(task, true)">Reintentar</button>
          </template>
        </li>
      </ul>
      <p v-if="!visibleTasks.length" class="px-5 py-8 text-center text-sm text-text-muted">No hay regeneraciones en esta categoría.</p>
    </section>
    <button ref="toggle" type="button" :aria-expanded="open" :aria-controls="panelId" class="flex items-center gap-3 rounded-full border border-accent/40 bg-surface px-5 py-3 text-sm shadow-lg transition hover:border-accent" @click="open = !open"><span aria-hidden="true" :class="running ? 'animate-spin' : ''">↻</span> Regeneraciones <span class="text-xs text-text-muted">{{ running }} en curso · {{ ready }} listas<span v-if="failed"> · {{ failed }} errores</span></span></button>
  </div>
</template>
<script setup lang="ts">
import { regenerationLocation, type StudioRegenerationTask } from '../../utils/studio-regenerations'
withDefaults(defineProps<{ disabled?: boolean; review?: boolean }>(), { disabled: false, review: false })
const emit = defineEmits<{ navigate: [] }>()
const { regenerationTasks } = useStudioRegenerations()
const router = useRouter()
const panelId = useId()
const open = ref(false)
const filter = ref<'all' | StudioRegenerationTask['status']>('all')
const root = ref<HTMLElement | null>(null)
const toggle = ref<HTMLButtonElement | null>(null)
const running = computed(() => regenerationTasks.value.filter(task => task.status === 'running').length)
const ready = computed(() => regenerationTasks.value.filter(task => task.status === 'ready').length)
const failed = computed(() => regenerationTasks.value.filter(task => task.status === 'error').length)
const tabs = computed(() => [
  { value: 'all' as const, label: 'Todas', count: regenerationTasks.value.length },
  { value: 'running' as const, label: 'En curso', count: running.value },
  { value: 'ready' as const, label: 'Listas', count: ready.value },
  { value: 'error' as const, label: 'Errores', count: failed.value }
])
const visibleTasks = computed(() => regenerationTasks.value.filter(task => filter.value === 'all' || task.status === filter.value))
function busy(task: StudioRegenerationTask) {
  return regenerationTasks.value.some(item => item.status === 'running' && item.request.projectSlug === task.request.projectSlug && item.request.conceptId === task.request.conceptId)
}
function close() { open.value = false; toggle.value?.focus() }
async function visit(task: StudioRegenerationTask, retry = false) {
  open.value = false
  emit('navigate')
  await router.push(regenerationLocation(task, retry))
}
function onTrayKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (open.value) { event.preventDefault(); event.stopPropagation(); close() }
    return
  }
  event.stopPropagation()
}
function outside(event: PointerEvent) {
  if (open.value && event.target instanceof Node && !root.value?.contains(event.target)) close()
}
onMounted(() => document.addEventListener('pointerdown', outside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', outside))
</script>

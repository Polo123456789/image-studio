<template>
  <Teleport to="body">
    <dialog ref="dialog" aria-labelledby="discard-bad-title" class="m-auto w-[min(92vw,480px)] max-h-[85dvh] overflow-y-auto rounded-xl border border-border bg-surface p-6 text-text backdrop:bg-black/70" @cancel.prevent="!saving && emit('close')">
      <h2 id="discard-bad-title" class="font-display text-2xl">¿Eliminar {{ concepts.length }} {{ concepts.length === 1 ? 'concepto' : 'conceptos' }}?</h2>
      <p class="mt-4 text-sm leading-6 text-text-muted">Todos tienen únicamente imágenes evaluadas como malas. Dejarán de aparecer en el proyecto y en la biblioteca. Sus imágenes se conservarán.</p>
      <ul class="mt-5 divide-y divide-border rounded-lg border border-border px-4">
        <li v-for="concept in concepts" :key="concept.id" class="py-3 text-sm">
          {{ concept.title }}
          <span class="mt-1 block text-xs text-text-muted">{{ imageCount(concept) }} {{ imageCount(concept) === 1 ? 'imagen mala' : 'imágenes malas' }}</span>
        </li>
      </ul>
      <p v-if="error" role="alert" class="mt-4 text-sm text-danger">{{ error }}</p>
      <div class="mt-6 flex justify-end gap-3">
        <button ref="cancel" type="button" :disabled="saving" class="rounded-lg border border-border px-4 py-2.5 text-sm disabled:opacity-50" @click="emit('close')">Cancelar</button>
        <button type="button" :disabled="saving" class="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm text-danger disabled:opacity-50" @click="emit('confirm')">{{ saving ? 'Eliminando...' : `Eliminar ${concepts.length} ${concepts.length === 1 ? 'concepto' : 'conceptos'}` }}</button>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import type { StudioConcept } from '../../../shared/types/studio'
defineProps<{ concepts: StudioConcept[]; saving: boolean; error: string }>()
const emit = defineEmits<{ close: []; confirm: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
const cancel = ref<HTMLButtonElement | null>(null)
const imageCount = (concept: StudioConcept) => concept.formats.flatMap(format => format.variants).filter(variant => variant.imageUrl?.trim()).length
let previousOverflow = ''
onMounted(() => {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  dialog.value?.showModal()
  cancel.value?.focus()
})
onBeforeUnmount(() => {
  dialog.value?.close()
  document.body.style.overflow = previousOverflow
})
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
    <div class="border-b border-border px-6 py-5">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">Resultado</p>
          <h2 class="mt-1.5 text-xl text-text">Guia generada</h2>
        </div>

        <div v-if="generatedContent" class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted transition hover:border-accent/40 hover:text-text"
            @click="$emit('copy-content')"
          >
            {{ justCopied ? 'Copiado' : 'Copiar' }}
          </button>
        </div>
      </div>
    </div>

    <div class="flex min-h-[500px] flex-col">
      <div
        v-if="!generatedContent && !isGenerating"
        class="flex flex-1 flex-col items-center justify-center gap-5 px-8 py-16 text-center"
      >
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="text-text-muted"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
        </div>
        <div>
          <p class="text-sm text-text">Todavia no hay una guia generada</p>
          <p class="mt-2 max-w-sm text-xs leading-5 text-text-muted">
            Sube referencias, agrega contexto si hace falta y ejecuta el analisis para obtener la estructura lista para guardar.
          </p>
        </div>
        <div class="mt-2 flex items-center gap-6 text-[10px] font-mono uppercase tracking-wider text-text-muted/60">
          <span class="flex items-center gap-1.5">
            <span class="h-1 w-1 rounded-full" :class="selectedFiles.length ? 'bg-accent' : 'bg-text-muted/40'" />
            Imagenes
          </span>
          <span class="flex items-center gap-1.5">
            <span class="h-1 w-1 rounded-full" :class="promptDraft.trim() ? 'bg-accent' : 'bg-text-muted/40'" />
            Prompt
          </span>
          <span class="flex items-center gap-1.5">
            <span class="h-1 w-1 rounded-full bg-text-muted/40" />
            Guia
          </span>
        </div>
      </div>

      <div v-else-if="isGenerating" class="flex flex-1 flex-col items-center justify-center gap-5 px-8 py-16">
        <div class="relative">
          <div class="h-16 w-16 rounded-2xl bg-accent/10" />
          <div class="absolute inset-0 flex items-center justify-center">
            <svg class="h-6 w-6 animate-spin text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
        <div class="text-center">
          <p class="text-sm text-text">Gemini Flash esta analizando las referencias</p>
          <p class="mt-2 text-xs text-text-muted">
            Procesando {{ selectedFiles.length }} {{ selectedFiles.length === 1 ? 'imagen' : 'imagenes' }}
            {{ description.trim() ? 'con contexto adicional' : '' }}
          </p>
        </div>
        <div class="mt-2 h-0.5 w-48 overflow-hidden rounded-full bg-surface-2">
          <div class="h-full w-1/3 animate-pulse rounded-full bg-accent/60" style="animation: slide 2s ease-in-out infinite;" />
        </div>
      </div>

      <div v-else class="flex flex-1 flex-col">
        <div class="flex-1 px-6 py-5">
          <AppTextarea
            :model-value="generatedContent"
            class="min-h-[420px] font-mono text-[12px] leading-6"
            :rows="22"
            placeholder="La guia tecnica aparecera aqui."
            @update:model-value="$emit('update:generated-content', $event)"
          />
        </div>

        <div class="border-t border-border bg-surface-2/30 px-6 py-5">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-text">Guardar en biblioteca</p>
              <p class="mt-1 text-xs leading-5 text-text-muted">
                Se guardara {{ brandSelection ? 'asociada a la marca seleccionada' : 'como guia global' }}.
              </p>
            </div>

            <AppButton :disabled="isSavingGuide || !canSaveGuide" @click="$emit('save-guide')">
              {{ isSavingGuide ? 'Guardando...' : 'Guardar guia' }}
            </AppButton>
          </div>

          <p v-if="saveFeedback" class="mt-3 text-xs" :class="saveFeedbackClass">
            {{ saveFeedback }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import AppButton from '~/components/base/AppButton.vue'
import AppTextarea from '~/components/base/AppTextarea.vue'

interface SelectedFileItem {
  key: string
  file: File
  previewUrl: string
}

defineProps<{
  generatedContent: string
  isGenerating: boolean
  justCopied: boolean
  selectedFiles: SelectedFileItem[]
  promptDraft: string
  description: string
  brandSelection: string
  isSavingGuide: boolean
  canSaveGuide: boolean
  saveFeedback: string
  saveFeedbackClass: string
}>()

defineEmits<{
  'copy-content': []
  'update:generated-content': [value: string | number]
  'save-guide': []
}>()
</script>

<style scoped>
@keyframes slide {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(300%); }
  100% { transform: translateX(-100%); }
}
</style>

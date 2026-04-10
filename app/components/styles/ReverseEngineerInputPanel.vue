<template>
  <div class="flex flex-col gap-6">
    <section class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div class="border-b border-border px-6 py-5">
        <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">Paso 1</p>
        <h2 class="mt-1.5 text-xl text-text">Referencias visuales</h2>
        <p class="mt-2 text-sm leading-6 text-text-muted">
          Las imagenes solo se usan para este analisis y no se guardan en la biblioteca.
        </p>
      </div>

      <div class="px-6 py-6">
        <div
          class="group relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200"
          :class="isDragging
            ? 'border-accent bg-accent/5'
            : selectedFiles.length
              ? 'border-border bg-surface-2/30'
              : 'border-border hover:border-accent/30 hover:bg-surface-2/20'"
          @dragenter.prevent="$emit('drag-state-change', true)"
          @dragover.prevent="$emit('drag-state-change', true)"
          @dragleave.prevent="$emit('drag-state-change', false)"
          @drop.prevent="$emit('drop', $event)"
        >
          <div v-if="!selectedFiles.length" class="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <div
              class="flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-200"
              :class="isDragging ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-text-muted'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            </div>
            <div>
              <p class="text-sm text-text">
                {{ isDragging ? 'Suelta las imagenes aqui' : 'Arrastra imagenes o seleccionalas' }}
              </p>
              <p class="mt-1.5 text-xs text-text-muted">JPG, PNG o WEBP</p>
            </div>
            <label class="cursor-pointer rounded-lg border border-border px-4 py-2 text-xs font-medium text-text-muted transition hover:border-accent/40 hover:text-text">
              Seleccionar archivos
              <input
                class="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                @change="$emit('file-selection', $event)"
              >
            </label>
          </div>

          <div v-else class="p-3">
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="file in selectedFiles"
                :key="file.key"
                class="group/card relative overflow-hidden rounded-lg"
              >
                <div class="aspect-[4/3] overflow-hidden bg-surface-2">
                  <img
                    :src="file.previewUrl"
                    :alt="file.file.name"
                    class="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                  >
                </div>
                <div class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
                  <div class="flex items-end justify-between p-2.5">
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-xs font-medium text-white">{{ file.file.name }}</p>
                      <p class="mt-0.5 font-mono text-[10px] text-white/60">{{ formatFileSize(file.file.size) }}</p>
                    </div>
                    <button
                      type="button"
                      class="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/15 text-white/80 backdrop-blur-sm transition hover:bg-danger/80 hover:text-white"
                      @click="$emit('remove-file', file.key)"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                </div>
              </div>

              <label
                v-if="selectedFiles.length < maxFiles"
                class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-2/30 transition-colors hover:border-accent/30 hover:bg-surface-2/50"
                :class="selectedFiles.length % 2 === 0 ? 'col-span-2 py-6' : 'aspect-[4/3]'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-text-muted"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                <span class="text-[10px] text-text-muted">{{ maxFiles - selectedFiles.length }} mas</span>
                <input
                  class="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  @change="$emit('file-selection', $event)"
                >
              </label>
            </div>

            <div class="mt-3 flex items-center justify-between rounded-lg bg-surface-2/60 px-3 py-2">
              <span class="font-mono text-[10px] text-text-muted">
                {{ selectedFiles.length }}/{{ maxFiles }} referencias
              </span>
              <button
                type="button"
                class="text-[10px] text-text-muted transition hover:text-danger"
                @click="$emit('clear-files')"
              >
                Quitar todas
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div class="border-b border-border px-6 py-5">
        <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">Paso 2</p>
        <h2 class="mt-1.5 text-xl text-text">Contexto y configuracion</h2>
      </div>

      <form class="space-y-5 px-6 py-6" @submit.prevent="$emit('generate-guide')">
        <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
          <label class="block text-xs font-medium text-text-muted">
            Nombre sugerido
            <AppInput
              :model-value="saveForm.name"
              class="mt-1.5"
              maxlength="120"
              placeholder="Ej. Campana editorial premium"
              @update:model-value="$emit('update:save-name', $event)"
            />
          </label>

          <label class="block text-xs font-medium text-text-muted">
            Marca
            <AppSelect :model-value="brandSelection" class="mt-1.5" @update:model-value="$emit('update:brand-selection', $event)">
              <option value="">Global</option>
              <option v-for="brand in brandOptions" :key="brand.id" :value="String(brand.id)">
                {{ brand.name }}
              </option>
            </AppSelect>
          </label>
        </div>

        <label class="block text-xs font-medium text-text-muted">
          Descripcion adicional
          <AppTextarea
            :model-value="description"
            class="mt-1.5"
            :rows="3"
            placeholder="Ej. Marca de skincare premium, suele hablarle a mujeres de 30-45, evita humor y tonos estridentes."
            @update:model-value="$emit('update:description', $event)"
          />
        </label>

        <div class="rounded-xl border border-border bg-surface-2/30">
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-3 text-left"
            @click="$emit('toggle-prompt')"
          >
            <div class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                class="text-text-muted transition-transform duration-200"
                :class="showPrompt ? 'rotate-90' : ''"
              ><polyline points="9 18 15 12 9 6" /></svg>
              <span class="text-xs font-medium text-text-muted">Prompt maestro</span>
            </div>
            <span
              v-if="isPromptModified"
              class="rounded-full bg-accent/12 px-2 py-0.5 text-[10px] font-medium text-accent"
            >
              Modificado
            </span>
          </button>

          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-[600px] opacity-100"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="max-h-[600px] opacity-100"
            leave-to-class="max-h-0 opacity-0"
          >
            <div v-show="showPrompt" class="overflow-hidden">
              <div class="space-y-3 px-4 pb-4">
                <AppTextarea
                  :model-value="promptDraft"
                  class="min-h-[200px] font-mono text-[12px] leading-6"
                  :rows="10"
                  placeholder="Prompt maestro para reconstruir la guia de estilo."
                  @update:model-value="$emit('update:prompt-draft', $event)"
                />
                <button
                  v-if="isPromptModified"
                  type="button"
                  class="text-[11px] text-text-muted transition hover:text-accent"
                  @click="$emit('restore-prompt')"
                >
                  Restaurar prompt original
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <div class="flex items-center justify-between gap-4 border-t border-border pt-5">
          <button
            type="button"
            class="text-xs text-text-muted transition hover:text-text"
            @click="$emit('reset-input')"
          >
            Limpiar todo
          </button>

          <div class="flex items-center gap-3">
            <p
              v-if="generationFeedback"
              class="max-w-[200px] text-right text-xs leading-4"
              :class="generationFeedbackClass"
            >
              {{ generationFeedback }}
            </p>

            <AppButton type="submit" :disabled="isGenerating || !canGenerate">
              {{ isGenerating ? 'Analizando...' : 'Generar guia' }}
            </AppButton>
          </div>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { BrandOption } from '../../../shared/types/brands'

import AppButton from '~/components/base/AppButton.vue'
import AppInput from '~/components/base/AppInput.vue'
import AppSelect from '~/components/base/AppSelect.vue'
import AppTextarea from '~/components/base/AppTextarea.vue'

interface SelectedFileItem {
  key: string
  file: File
  previewUrl: string
}

defineProps<{
  maxFiles: number
  isDragging: boolean
  selectedFiles: SelectedFileItem[]
  saveForm: { name: string }
  brandSelection: string
  brandOptions: BrandOption[]
  description: string
  promptDraft: string
  showPrompt: boolean
  isPromptModified: boolean
  generationFeedback: string
  generationFeedbackClass: string
  isGenerating: boolean
  canGenerate: boolean
  formatFileSize: (size: number) => string
}>()

defineEmits<{
  'drag-state-change': [value: boolean]
  drop: [event: DragEvent]
  'file-selection': [event: Event]
  'remove-file': [key: string]
  'clear-files': []
  'update:save-name': [value: string | number]
  'update:brand-selection': [value: string | number]
  'update:description': [value: string | number]
  'toggle-prompt': []
  'update:prompt-draft': [value: string | number]
  'restore-prompt': []
  'reset-input': []
  'generate-guide': []
}>()
</script>

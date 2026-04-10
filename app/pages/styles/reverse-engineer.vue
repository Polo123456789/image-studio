<template>
  <div class="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
    <div class="mx-auto max-w-7xl">
      <NuxtLink
        to="/styles"
        class="mb-6 inline-flex items-center gap-1.5 text-xs text-text-muted transition hover:text-text"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        Volver a guias
      </NuxtLink>

      <header class="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Guias de estilo</p>
          <h1 class="mt-3 font-display text-3xl text-text">Ingenieria inversa</h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-text-muted">
            Sube varios posts o anuncios de una marca, agrega contexto si hace falta y Gemini Flash
            devolvera una guia de estilo tecnica lista para reutilizar o guardar.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            Analisis efimero
          </span>
          <span class="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs tabular-nums text-text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            Hasta {{ maxFiles }} imagenes
          </span>
        </div>
      </header>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <ReverseEngineerInputPanel
          :max-files="maxFiles"
          :is-dragging="isDragging"
          :selected-files="selectedFiles"
          :save-form="saveForm"
          :brand-selection="brandSelection"
          :brand-options="brandOptions"
          :description="description"
          :prompt-draft="promptDraft"
          :show-prompt="showPrompt"
          :is-prompt-modified="isPromptModified"
          :generation-feedback="generationFeedback"
          :generation-feedback-class="generationFeedbackClass"
          :is-generating="isGenerating"
          :can-generate="canGenerate"
          :format-file-size="formatFileSize"
          @drag-state-change="isDragging = $event"
          @drop="handleDrop"
          @file-selection="handleFileSelection"
          @remove-file="removeFile"
          @clear-files="clearFiles"
          @update:save-name="saveForm.name = String($event)"
          @update:brand-selection="brandSelection = String($event)"
          @update:description="description = String($event)"
          @toggle-prompt="showPrompt = !showPrompt"
          @update:prompt-draft="promptDraft = String($event)"
          @restore-prompt="restorePrompt"
          @reset-input="resetInput"
          @generate-guide="generateGuide"
        />

        <ReverseEngineerOutputPanel
          :generated-content="generatedContent"
          :is-generating="isGenerating"
          :just-copied="justCopied"
          :selected-files="selectedFiles"
          :prompt-draft="promptDraft"
          :description="description"
          :brand-selection="brandSelection"
          :is-saving-guide="isSavingGuide"
          :can-save-guide="canSaveGuide"
          :save-feedback="saveFeedback"
          :save-feedback-class="saveFeedbackClass"
          @copy-content="copyContent"
          @update:generated-content="generatedContent = String($event)"
          @save-guide="saveGuide"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ReverseEngineerInputPanel from '~/components/styles/ReverseEngineerInputPanel.vue'
import ReverseEngineerOutputPanel from '~/components/styles/ReverseEngineerOutputPanel.vue'

const {
  maxFiles,
  brandSelection,
  description,
  promptDraft,
  selectedFiles,
  generatedContent,
  isGenerating,
  isSavingGuide,
  generationFeedback,
  saveFeedback,
  isDragging,
  showPrompt,
  justCopied,
  saveForm,
  brandOptions,
  canGenerate,
  canSaveGuide,
  isPromptModified,
  generationFeedbackClass,
  saveFeedbackClass,
  formatFileSize,
  restorePrompt,
  clearFiles,
  resetInput,
  removeFile,
  handleFileSelection,
  handleDrop,
  copyContent,
  generateGuide,
  saveGuide
} = await useReverseEngineerStyleGuide()
</script>

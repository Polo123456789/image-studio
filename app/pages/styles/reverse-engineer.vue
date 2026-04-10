<template>
  <div class="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
    <div class="mx-auto max-w-7xl">
      <!-- Back link -->
      <NuxtLink
        to="/styles"
        class="mb-6 inline-flex items-center gap-1.5 text-xs text-text-muted transition hover:text-text"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        Volver a guias
      </NuxtLink>

      <!-- Page header -->
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

      <!-- Main two-column layout -->
      <div class="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <!-- ─── LEFT: Input panel ──────────────────────────────────── -->
        <div class="flex flex-col gap-6">
          <!-- Upload zone -->
          <section class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <div class="border-b border-border px-6 py-5">
              <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">Paso 1</p>
              <h2 class="mt-1.5 text-xl text-text">Referencias visuales</h2>
              <p class="mt-2 text-sm leading-6 text-text-muted">
                Las imagenes solo se usan para este analisis y no se guardan en la biblioteca.
              </p>
            </div>

            <div class="px-6 py-6">
              <!-- Dropzone -->
              <div
                class="group relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200"
                :class="isDragging
                  ? 'border-accent bg-accent/5'
                  : selectedFiles.length
                    ? 'border-border bg-surface-2/30'
                    : 'border-border hover:border-accent/30 hover:bg-surface-2/20'"
                @dragenter.prevent="isDragging = true"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleDrop"
              >
                <!-- Empty upload state -->
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
                      @change="handleFileSelection"
                    >
                  </label>
                </div>

                <!-- Image preview grid -->
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
                      <!-- Overlay on hover -->
                      <div class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
                        <div class="flex items-end justify-between p-2.5">
                          <div class="min-w-0 flex-1">
                            <p class="truncate text-xs font-medium text-white">{{ file.file.name }}</p>
                            <p class="mt-0.5 font-mono text-[10px] text-white/60">{{ formatFileSize(file.file.size) }}</p>
                          </div>
                          <button
                            type="button"
                            class="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/15 text-white/80 backdrop-blur-sm transition hover:bg-danger/80 hover:text-white"
                            @click="removeFile(file.key)"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Add more slot -->
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
                        @change="handleFileSelection"
                      >
                    </label>
                  </div>

                  <!-- File count bar -->
                  <div class="mt-3 flex items-center justify-between rounded-lg bg-surface-2/60 px-3 py-2">
                    <span class="font-mono text-[10px] text-text-muted">
                      {{ selectedFiles.length }}/{{ maxFiles }} referencias
                    </span>
                    <button
                      type="button"
                      class="text-[10px] text-text-muted transition hover:text-danger"
                      @click="clearFiles"
                    >
                      Quitar todas
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Context & config -->
          <section class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <div class="border-b border-border px-6 py-5">
              <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">Paso 2</p>
              <h2 class="mt-1.5 text-xl text-text">Contexto y configuracion</h2>
            </div>

            <form class="space-y-5 px-6 py-6" @submit.prevent="generateGuide">
              <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
                <label class="block text-xs font-medium text-text-muted">
                  Nombre sugerido
                  <AppInput
                    v-model="saveForm.name"
                    class="mt-1.5"
                    maxlength="120"
                    placeholder="Ej. Campana editorial premium"
                  />
                </label>

                <label class="block text-xs font-medium text-text-muted">
                  Marca
                  <AppSelect v-model="brandSelection" class="mt-1.5">
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
                  v-model="description"
                  class="mt-1.5"
                  :rows="3"
                  placeholder="Ej. Marca de skincare premium, suele hablarle a mujeres de 30-45, evita humor y tonos estridentes."
                />
              </label>

              <!-- Collapsible prompt section -->
              <div class="rounded-xl border border-border bg-surface-2/30">
                <button
                  type="button"
                  class="flex w-full items-center justify-between px-4 py-3 text-left"
                  @click="showPrompt = !showPrompt"
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
                        v-model="promptDraft"
                        class="min-h-[200px] font-mono text-[12px] leading-6"
                        :rows="10"
                        placeholder="Prompt maestro para reconstruir la guia de estilo."
                      />
                      <button
                        v-if="isPromptModified"
                        type="button"
                        class="text-[11px] text-text-muted transition hover:text-accent"
                        @click="restorePrompt"
                      >
                        Restaurar prompt original
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Generate action -->
              <div class="flex items-center justify-between gap-4 border-t border-border pt-5">
                <button
                  type="button"
                  class="text-xs text-text-muted transition hover:text-text"
                  @click="resetInput"
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

        <!-- ─── RIGHT: Output panel ────────────────────────────────── -->
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
                  @click="copyContent"
                >
                  {{ justCopied ? 'Copiado' : 'Copiar' }}
                </button>
              </div>
            </div>
          </div>

          <div class="flex min-h-[500px] flex-col">
            <!-- Empty state -->
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

            <!-- Loading state -->
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
              <!-- Animated bar -->
              <div class="mt-2 h-0.5 w-48 overflow-hidden rounded-full bg-surface-2">
                <div class="h-full w-1/3 animate-pulse rounded-full bg-accent/60" style="animation: slide 2s ease-in-out infinite;" />
              </div>
            </div>

            <!-- Generated content -->
            <div v-else class="flex flex-1 flex-col">
              <div class="flex-1 px-6 py-5">
                <AppTextarea
                  v-model="generatedContent"
                  class="min-h-[420px] font-mono text-[12px] leading-6"
                  :rows="22"
                  placeholder="La guia tecnica aparecera aqui."
                />
              </div>

              <!-- Save section -->
              <div class="border-t border-border bg-surface-2/30 px-6 py-5">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p class="text-sm text-text">Guardar en biblioteca</p>
                    <p class="mt-1 text-xs leading-5 text-text-muted">
                      Se guardara {{ brandSelection ? 'asociada a la marca seleccionada' : 'como guia global' }}.
                    </p>
                  </div>

                  <AppButton :disabled="isSavingGuide || !canSaveGuide" @click="saveGuide">
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BrandOption } from '../../../shared/types/brands'
import type { AppSettingsResponse } from '../../../shared/types/settings'
import type { ReverseEngineeredStyleGuideResponse, StyleGuidePayload, StyleGuideRecord, StyleGuidesResponse } from '../../../shared/types/style-guides'

import AppButton from '~/components/base/AppButton.vue'
import AppInput from '~/components/base/AppInput.vue'
import AppSelect from '~/components/base/AppSelect.vue'
import AppTextarea from '~/components/base/AppTextarea.vue'
import { getRequestErrorMessage } from '~/utils/http-errors'

interface SelectedFileItem {
  key: string
  file: File
  previewUrl: string
}

const maxFiles = 8

const { data: styleGuideData } = await useFetch<StyleGuidesResponse>('/api/style-guides')
const { data: settingsData } = await useFetch<AppSettingsResponse>('/api/settings')

const brandSelection = ref('')
const description = ref('')
const promptDraft = ref('')
const selectedFiles = ref<SelectedFileItem[]>([])
const generatedContent = ref('')
const isGenerating = ref(false)
const isSavingGuide = ref(false)
const generationFeedback = ref('')
const generationFeedbackTone = ref<'success' | 'error'>('success')
const saveFeedback = ref('')
const saveFeedbackTone = ref<'success' | 'error'>('success')
const isDragging = ref(false)
const showPrompt = ref(false)
const justCopied = ref(false)

const saveForm = reactive({
  name: ''
})

const brandOptions = computed<BrandOption[]>(() => styleGuideData.value?.brands ?? [])
const loadedPrompt = computed(() => settingsData.value?.styleGuideReverseEngineeringPrompt ?? '')
const canGenerate = computed(() => selectedFiles.value.length > 0 && Boolean(promptDraft.value.trim()))
const canSaveGuide = computed(() => Boolean(saveForm.name.trim() && generatedContent.value.trim()))
const isPromptModified = computed(() => promptDraft.value.trim() !== loadedPrompt.value.trim())
const generationFeedbackClass = computed(() => generationFeedbackTone.value === 'success' ? 'text-accent' : 'text-danger')
const saveFeedbackClass = computed(() => saveFeedbackTone.value === 'success' ? 'text-accent' : 'text-danger')

watch(loadedPrompt, (value) => {
  if (!promptDraft.value.trim()) {
    promptDraft.value = value
  }
}, { immediate: true })

onBeforeUnmount(() => {
  for (const file of selectedFiles.value) {
    URL.revokeObjectURL(file.previewUrl)
  }
})

function getErrorMessage(error: unknown, fallback: string) {
  return getRequestErrorMessage(error, fallback)
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function restorePrompt() {
  promptDraft.value = loadedPrompt.value
}

function clearFiles() {
  for (const file of selectedFiles.value) {
    URL.revokeObjectURL(file.previewUrl)
  }
  selectedFiles.value = []
}

function resetInput() {
  description.value = ''
  saveForm.name = ''
  generatedContent.value = ''
  generationFeedback.value = ''
  saveFeedback.value = ''
  restorePrompt()
  clearFiles()
}

function removeFile(key: string) {
  const item = selectedFiles.value.find((entry) => entry.key === key)
  if (item) {
    URL.revokeObjectURL(item.previewUrl)
  }

  selectedFiles.value = selectedFiles.value.filter((entry) => entry.key !== key)
}

function addFiles(files: File[]) {
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
  const validFiles = files.filter((file) => acceptedTypes.includes(file.type))

  if (!validFiles.length) {
    generationFeedback.value = 'Solo se aceptan imagenes JPG, PNG o WEBP.'
    generationFeedbackTone.value = 'error'
    return
  }

  const nextFiles = validFiles.slice(0, maxFiles - selectedFiles.value.length).map((file, index) => ({
    key: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${index}`,
    file,
    previewUrl: URL.createObjectURL(file)
  }))

  if (!nextFiles.length) {
    generationFeedback.value = `Puedes analizar hasta ${maxFiles} imagenes por tanda.`
    generationFeedbackTone.value = 'error'
    return
  }

  selectedFiles.value = [...selectedFiles.value, ...nextFiles]
  generationFeedback.value = ''
}

function handleFileSelection(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length) addFiles(files)
  input.value = ''
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const files = Array.from(event.dataTransfer?.files ?? [])
  if (files.length) addFiles(files)
}

async function copyContent() {
  if (!generatedContent.value) return
  try {
    await navigator.clipboard.writeText(generatedContent.value)
    justCopied.value = true
    setTimeout(() => { justCopied.value = false }, 2000)
  } catch {
    // Clipboard not available
  }
}

async function generateGuide() {
  if (!canGenerate.value) {
    generationFeedback.value = 'Carga al menos una imagen y deja un prompt activo antes de analizar.'
    generationFeedbackTone.value = 'error'
    return
  }

  isGenerating.value = true
  generationFeedback.value = ''
  saveFeedback.value = ''

  try {
    const formData = new FormData()
    formData.append('description', [
      description.value.trim(),
      '',
      `Prompt maestro activo: ${promptDraft.value.trim()}`
    ].filter(Boolean).join('\n'))

    for (const item of selectedFiles.value) {
      formData.append('files', item.file)
    }

    const response = await $fetch<ReverseEngineeredStyleGuideResponse>('/api/style-guides/reverse-engineer', {
      method: 'POST',
      body: formData
    })

    generatedContent.value = response.content

    if (!saveForm.name.trim()) {
      saveForm.name = 'Guia reverse engineered'
    }

    generationFeedback.value = 'Guia generada. Revisa y guarda si te sirve.'
    generationFeedbackTone.value = 'success'
  } catch (error) {
    generationFeedback.value = getErrorMessage(error, 'No se pudo generar la guia.')
    generationFeedbackTone.value = 'error'
  } finally {
    isGenerating.value = false
  }
}

async function saveGuide() {
  if (!canSaveGuide.value) {
    saveFeedback.value = 'Completa nombre y contenido antes de guardar.'
    saveFeedbackTone.value = 'error'
    return
  }

  isSavingGuide.value = true
  saveFeedback.value = ''

  try {
    const payload: StyleGuidePayload = {
      name: saveForm.name,
      content: generatedContent.value,
      brandId: brandSelection.value ? Number(brandSelection.value) : null
    }

    const created = await $fetch<StyleGuideRecord>('/api/style-guides', {
      method: 'POST',
      body: payload
    })

    saveFeedback.value = `Guia guardada como "${created.name}".`
    saveFeedbackTone.value = 'success'
  } catch (error) {
    saveFeedback.value = getErrorMessage(error, 'No se pudo guardar la guia.')
    saveFeedbackTone.value = 'error'
  } finally {
    isSavingGuide.value = false
  }
}
</script>

<style scoped>
@keyframes slide {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(300%); }
  100% { transform: translateX(-100%); }
}
</style>

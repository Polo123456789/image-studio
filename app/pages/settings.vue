<template>
  <div class="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
    <div class="mx-auto max-w-4xl">
      <header class="mb-12 flex flex-col gap-5 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Configuracion</p>
          <h2 class="mt-3 font-display text-3xl text-text">
            Proveedor y system prompts
          </h2>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
            Define la llave de Gemini y los prompts base que moldean como el estudio propone conceptos y genera imagenes.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <span
            class="rounded-full px-3 py-1.5 text-xs font-medium"
            :class="settingsStateClass"
          >
            Gemini API key: {{ settingsStateLabel }}
          </span>
        </div>
      </header>

      <div v-if="pending" class="rounded-2xl border border-border bg-surface px-6 py-8 text-sm text-text-muted">
        Cargando configuracion...
      </div>

      <form v-else class="space-y-8" @submit.prevent="saveSettings">
        <section class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div class="border-b border-border px-6 py-5">
            <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">Proveedor</p>
            <h3 class="mt-2 text-xl text-text">Gemini</h3>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
              La llave se guarda en la base local del estudio. Si quieres puedes reemplazarla en cualquier momento.
            </p>
          </div>

          <div class="px-6 py-6">
            <label class="block text-sm font-medium text-text">
              API key
            </label>
            <p class="mt-2 text-sm leading-6 text-text-muted">
              Formato esperado: clave de Gemini para llamadas server-side.
            </p>
            <AppInput
              v-model="form.geminiApiKey"
              class="mt-4"
              type="password"
              autocomplete="off"
              placeholder="Pega aqui tu Gemini API key"
            />
          </div>
        </section>

        <section class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div class="border-b border-border px-6 py-5">
            <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">Prompt base</p>
            <h3 class="mt-2 text-xl text-text">Generador de conceptos</h3>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
              Se antepone a la instruccion dinamica del brief cuando Gemini redacta la tanda inicial de conceptos y prompts por formato.
            </p>
          </div>

          <div class="px-6 py-6">
            <AppTextarea
              v-model="form.conceptGeneratorPrompt"
              :rows="8"
              placeholder="Define el rol, tono y criterios del generador de conceptos."
            ></AppTextarea>
          </div>
        </section>

        <section class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div class="border-b border-border px-6 py-5">
            <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">Prompt base</p>
            <h3 class="mt-2 text-xl text-text">Generador de imagenes</h3>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
              Se usa como system prompt comun para previews e imagenes finales antes del prompt visual especifico de cada variante.
            </p>
          </div>

          <div class="px-6 py-6">
            <AppTextarea
              v-model="form.imageGeneratorPrompt"
              :rows="8"
              placeholder="Define el marco base para la generacion visual."
            ></AppTextarea>
          </div>
        </section>

        <div class="flex flex-col gap-3 rounded-2xl border border-border bg-surface-2/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-text">Guardar configuracion activa</p>
            <p class="mt-1 text-sm leading-6 text-text-muted">
              Estos valores empezaran a usarse en las siguientes generaciones del estudio.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              class="rounded border border-border px-4 py-2.5 text-sm text-text-muted transition hover:border-text-muted hover:text-text"
              @click="resetForm"
            >
              Restaurar cargado
            </button>

            <AppButton type="submit" :disabled="saving || !canSave">
              {{ saving ? 'Guardando...' : 'Guardar configuracion' }}
            </AppButton>
          </div>
        </div>

        <p v-if="feedback" class="text-sm" :class="feedbackClass">
          {{ feedback }}
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AppSettingsResponse } from '../../shared/types/settings'

import AppButton from '~/components/base/AppButton.vue'
import AppInput from '~/components/base/AppInput.vue'
import AppTextarea from '~/components/base/AppTextarea.vue'

const { data, pending } = await useFetch<AppSettingsResponse>('/api/settings')

const form = reactive({
  geminiApiKey: '',
  conceptGeneratorPrompt: '',
  imageGeneratorPrompt: ''
})

const loadedSnapshot = ref({
  geminiApiKey: '',
  conceptGeneratorPrompt: '',
  imageGeneratorPrompt: ''
})

const saving = ref(false)
const feedback = ref('')
const feedbackTone = ref<'success' | 'error'>('success')

watchEffect(() => {
  if (!data.value) {
    return
  }

  const nextSnapshot = {
    geminiApiKey: '',
    conceptGeneratorPrompt: data.value.conceptGeneratorPrompt,
    imageGeneratorPrompt: data.value.imageGeneratorPrompt
  }

  loadedSnapshot.value = nextSnapshot

  if (!saving.value) {
    Object.assign(form, nextSnapshot)
  }
})

const canSave = computed(() => {
  return Boolean(
    form.conceptGeneratorPrompt.trim()
    && form.imageGeneratorPrompt.trim()
  )
})

const settingsStateLabel = computed(() => data.value?.hasGeminiApiKey ? 'Activa' : 'Pendiente')
const settingsStateClass = computed(() => data.value?.hasGeminiApiKey
  ? 'bg-accent/15 text-accent'
  : 'bg-danger/10 text-danger')

const feedbackClass = computed(() => feedbackTone.value === 'success' ? 'text-accent' : 'text-danger')

function resetForm() {
  Object.assign(form, loadedSnapshot.value)
  feedback.value = ''
}

async function saveSettings() {
  if (!canSave.value) {
    feedback.value = 'Completa ambos system prompts antes de guardar.'
    feedbackTone.value = 'error'
    return
  }

  saving.value = true
  feedback.value = ''

  try {
    const response = await $fetch<AppSettingsResponse>('/api/settings', {
      method: 'POST',
      body: {
        geminiApiKey: form.geminiApiKey,
        conceptGeneratorPrompt: form.conceptGeneratorPrompt,
        imageGeneratorPrompt: form.imageGeneratorPrompt
      }
    })

    data.value = response
    Object.assign(form, {
      geminiApiKey: '',
      conceptGeneratorPrompt: response.conceptGeneratorPrompt,
      imageGeneratorPrompt: response.imageGeneratorPrompt
    })
    loadedSnapshot.value = {
      geminiApiKey: '',
      conceptGeneratorPrompt: response.conceptGeneratorPrompt,
      imageGeneratorPrompt: response.imageGeneratorPrompt
    }
    feedback.value = 'Configuracion guardada.'
    feedbackTone.value = 'success'
  }
  catch (error) {
    feedback.value = error instanceof Error ? error.message : 'No se pudo guardar la configuracion.'
    feedbackTone.value = 'error'
  }
  finally {
    saving.value = false
  }
}
</script>

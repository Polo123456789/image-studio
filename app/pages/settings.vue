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
            Define la llave de Gemini y los prompts base que moldean como el estudio propone conceptos, genera imagenes y reconstruye guias de estilo desde referencias.
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

        <section class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div class="border-b border-border px-6 py-5">
            <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">Prompt base</p>
            <h3 class="mt-2 text-xl text-text">Ingenieria inversa de guias</h3>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
              Se usa antes de analizar referencias visuales temporales para convertirlas en una guia de estilo tecnica reutilizable.
            </p>
          </div>

          <div class="px-6 py-6">
            <AppTextarea
              v-model="form.styleGuideReverseEngineeringPrompt"
              :rows="12"
              placeholder="Define la estructura y criterios para reconstruir una guia de estilo desde imagenes de referencia."
            ></AppTextarea>
          </div>
        </section>

        <CreativeStylesManager
          :model-value="creativeStylesData?.styles ?? []"
          @update:model-value="updateCreativeStyles"
        />

        <section class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div class="border-b border-border px-6 py-5">
            <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">Respaldo</p>
            <h3 class="mt-2 text-xl text-text">Exportar e importar todo el estudio</h3>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
              El backup incluye base local, assets subidos y la Gemini API key. Importar un backup reemplaza por completo el estado actual del estudio.
            </p>
          </div>

          <div class="space-y-5 px-6 py-6">
            <div class="flex flex-col gap-4 rounded-2xl border border-border bg-surface-2/60 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-text">Exportar respaldo completo</p>
                <p class="mt-1 text-sm leading-6 text-text-muted">
                  Descarga un ZIP con `local.db`, uploads y configuracion sensible para restaurarlo despues en esta misma app.
                </p>
              </div>

              <AppButton type="button" :disabled="exportingBackup || restoreStatus?.restoreInProgress" @click="exportBackup">
                {{ exportingBackup ? 'Preparando backup...' : 'Exportar backup' }}
              </AppButton>
            </div>

            <div class="rounded-2xl border border-danger/25 bg-danger/6 px-5 py-5">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p class="text-sm text-danger">Importar backup y sobreescribir todo</p>
                  <p class="mt-1 text-sm leading-6 text-text-muted">
                    Esta accion destruye el estado actual y lo reemplaza por el del archivo importado. Antes de restaurar, el sistema crea un snapshot temporal para rollback si algo falla.
                  </p>
                </div>

                <span
                  class="rounded-full px-3 py-1.5 text-xs font-medium"
                  :class="restoreStatus?.restoreInProgress ? 'bg-danger/12 text-danger' : 'bg-surface-2 text-text-muted'"
                >
                  {{ restoreStatus?.restoreInProgress ? 'Restauracion en curso' : 'Sin restauracion activa' }}
                </span>
              </div>

              <div class="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                <label class="flex-1 cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 transition hover:border-danger/35">
                  <span class="block text-sm text-text">Archivo de backup</span>
                  <span class="mt-1 block text-sm text-text-muted">
                    {{ selectedBackupFileName || 'Selecciona un archivo .zip exportado desde Image Studio' }}
                  </span>
                  <input class="hidden" type="file" accept=".zip,application/zip" @change="onBackupFileSelected">
                </label>

                <button
                  type="button"
                  class="rounded border border-danger/35 px-4 py-2.5 text-sm text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="!selectedBackupFile || restoringBackup || restoreStatus?.restoreInProgress"
                  @click="openRestoreModal"
                >
                  {{ restoringBackup ? 'Restaurando...' : 'Importar y sobreescribir' }}
                </button>
              </div>

              <p v-if="backupFeedback" class="mt-4 text-sm" :class="backupFeedbackClass">
                {{ backupFeedback }}
              </p>
            </div>
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

      <AppModal :open="isRestoreModalOpen" size="lg" @close="closeRestoreModal">
        <div class="border-b border-border px-5 py-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-danger">Accion destructiva</p>
              <h3 class="mt-2 text-lg text-text">Sobrescribir estudio completo</h3>
              <p class="mt-2 text-sm leading-6 text-text-muted">
                Vas a reemplazar base, assets, marcas, proyectos, prompts y Gemini API key con el contenido del backup seleccionado.
              </p>
            </div>

            <button
              type="button"
              class="rounded-lg border border-border p-2 text-text-muted transition hover:border-text-muted hover:text-text"
              @click="closeRestoreModal"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div class="space-y-4 px-5 py-5">
          <div class="rounded-xl border border-danger/25 bg-danger/8 px-4 py-4 text-sm leading-6 text-text-muted">
            Escribe <span class="font-mono text-danger">SOBREESCRIBIR</span> para confirmar. El archivo seleccionado es <span class="font-mono text-text">{{ selectedBackupFileName || 'sin archivo' }}</span>.
          </div>

          <div>
            <label class="block text-sm font-medium text-text">
              Confirmacion
            </label>
            <AppInput
              v-model="restoreConfirmation"
              class="mt-3"
              type="text"
              placeholder="Escribe SOBREESCRIBIR"
            />
          </div>
        </div>

        <div class="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          <p class="text-xs text-text-muted">
            Si la restauracion termina bien, recargaremos la aplicacion.
          </p>

          <div class="flex items-center gap-3">
            <button
              type="button"
              class="rounded border border-border px-4 py-2 text-sm text-text-muted transition hover:border-text-muted hover:text-text"
              :disabled="restoringBackup"
              @click="closeRestoreModal"
            >
              Cancelar
            </button>

            <button
              type="button"
              class="rounded border border-danger/35 px-4 py-2 text-sm text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="restoringBackup || !canConfirmRestore"
              @click="importBackup"
            >
              {{ restoringBackup ? 'Restaurando...' : 'Confirmar restore' }}
            </button>
          </div>
        </div>
      </AppModal>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BackupImportResponse, BackupStatusResponse } from '../../shared/types/backup'
import type { CreativeStylesResponse } from '../../shared/types/creative-styles'
import type { AppSettingsResponse } from '../../shared/types/settings'

import CreativeStylesManager from '~/components/settings/CreativeStylesManager.vue'
import AppButton from '~/components/base/AppButton.vue'
import AppInput from '~/components/base/AppInput.vue'
import AppModal from '~/components/base/AppModal.vue'
import AppTextarea from '~/components/base/AppTextarea.vue'

const { data, pending } = await useFetch<AppSettingsResponse>('/api/settings')
const { data: creativeStylesData } = await useFetch<CreativeStylesResponse>('/api/creative-styles')
const { data: restoreStatus, refresh: refreshRestoreStatus } = await useFetch<BackupStatusResponse>('/api/backup/status')

const form = reactive({
  geminiApiKey: '',
  conceptGeneratorPrompt: '',
  imageGeneratorPrompt: '',
  styleGuideReverseEngineeringPrompt: ''
})

const loadedSnapshot = ref({
  geminiApiKey: '',
  conceptGeneratorPrompt: '',
  imageGeneratorPrompt: '',
  styleGuideReverseEngineeringPrompt: ''
})

const saving = ref(false)
const feedback = ref('')
const feedbackTone = ref<'success' | 'error'>('success')
const exportingBackup = ref(false)
const restoringBackup = ref(false)
const selectedBackupFile = ref<File | null>(null)
const selectedBackupFileName = ref('')
const backupFeedback = ref('')
const backupFeedbackTone = ref<'success' | 'error'>('success')
const isRestoreModalOpen = ref(false)
const restoreConfirmation = ref('')

watchEffect(() => {
  if (!data.value) {
    return
  }

  const nextSnapshot = {
    geminiApiKey: '',
    conceptGeneratorPrompt: data.value.conceptGeneratorPrompt,
    imageGeneratorPrompt: data.value.imageGeneratorPrompt,
    styleGuideReverseEngineeringPrompt: data.value.styleGuideReverseEngineeringPrompt
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
    && form.styleGuideReverseEngineeringPrompt.trim()
  )
})

const settingsStateLabel = computed(() => data.value?.hasGeminiApiKey ? 'Activa' : 'Pendiente')
const settingsStateClass = computed(() => data.value?.hasGeminiApiKey
  ? 'bg-accent/15 text-accent'
  : 'bg-danger/10 text-danger')

const feedbackClass = computed(() => feedbackTone.value === 'success' ? 'text-accent' : 'text-danger')
const backupFeedbackClass = computed(() => backupFeedbackTone.value === 'success' ? 'text-accent' : 'text-danger')
const canConfirmRestore = computed(() => restoreConfirmation.value.trim() === 'SOBREESCRIBIR' && Boolean(selectedBackupFile.value))

function updateCreativeStyles(styles: CreativeStylesResponse['styles']) {
  if (creativeStylesData.value) {
    creativeStylesData.value.styles = styles
  }
}

function resetForm() {
  Object.assign(form, loadedSnapshot.value)
  feedback.value = ''
}

function onBackupFileSelected(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0] || null

  selectedBackupFile.value = file
  selectedBackupFileName.value = file?.name || ''
  backupFeedback.value = ''
}

function openRestoreModal() {
  if (!selectedBackupFile.value || restoreStatus.value?.restoreInProgress) {
    return
  }

  restoreConfirmation.value = ''
  isRestoreModalOpen.value = true
}

function closeRestoreModal() {
  if (restoringBackup.value) {
    return
  }

  isRestoreModalOpen.value = false
  restoreConfirmation.value = ''
}

async function exportBackup() {
  if (exportingBackup.value || restoreStatus.value?.restoreInProgress) {
    return
  }

  exportingBackup.value = true
  backupFeedback.value = ''

  try {
    const response = await $fetch.raw('/api/backup/export', {
      method: 'GET',
      responseType: 'blob'
    })
    const blob = response._data

    if (!(blob instanceof Blob)) {
      throw new Error('No se pudo preparar el backup completo.')
    }

    const objectUrl = URL.createObjectURL(blob)
    const contentDisposition = response.headers.get('content-disposition') || ''
    const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/i)
    const fileName = fileNameMatch?.[1] || 'image-studio-backup.zip'
    const link = document.createElement('a')

    link.href = objectUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)

    backupFeedback.value = 'Backup exportado.'
    backupFeedbackTone.value = 'success'
  }
  catch (error) {
    backupFeedback.value = error instanceof Error ? error.message : 'No se pudo exportar el backup completo.'
    backupFeedbackTone.value = 'error'
  }
  finally {
    exportingBackup.value = false
  }
}

async function importBackup() {
  if (!selectedBackupFile.value || !canConfirmRestore.value || restoringBackup.value) {
    return
  }

  restoringBackup.value = true
  backupFeedback.value = ''

  try {
    const formData = new FormData()

    formData.set('backup', selectedBackupFile.value)

    await $fetch<BackupImportResponse>('/api/backup/import', {
      method: 'POST',
      body: formData
    })

    backupFeedback.value = 'Backup restaurado. Recargando estudio...'
    backupFeedbackTone.value = 'success'
    isRestoreModalOpen.value = false
    restoreConfirmation.value = ''
    await refreshRestoreStatus()
    window.location.reload()
  }
  catch (error) {
    backupFeedback.value = error instanceof Error ? error.message : 'No se pudo importar el backup.'
    backupFeedbackTone.value = 'error'
    await refreshRestoreStatus()
  }
  finally {
    restoringBackup.value = false
  }
}

async function saveSettings() {
  if (!canSave.value) {
    feedback.value = 'Completa todos los prompts base antes de guardar.'
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
        imageGeneratorPrompt: form.imageGeneratorPrompt,
        styleGuideReverseEngineeringPrompt: form.styleGuideReverseEngineeringPrompt
      }
    })

    data.value = response
    Object.assign(form, {
      geminiApiKey: '',
      conceptGeneratorPrompt: response.conceptGeneratorPrompt,
      imageGeneratorPrompt: response.imageGeneratorPrompt,
      styleGuideReverseEngineeringPrompt: response.styleGuideReverseEngineeringPrompt
    })
    loadedSnapshot.value = {
      geminiApiKey: '',
      conceptGeneratorPrompt: response.conceptGeneratorPrompt,
      imageGeneratorPrompt: response.imageGeneratorPrompt,
      styleGuideReverseEngineeringPrompt: response.styleGuideReverseEngineeringPrompt
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

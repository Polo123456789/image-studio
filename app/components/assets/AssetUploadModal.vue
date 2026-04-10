<template>
  <AppModal :open="open" size="xl" @close="handleClose">
    <div class="border-b border-border px-6 py-5">
      <p class="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">Nuevo asset</p>
      <h2 class="mt-2 font-display text-2xl text-text">Preparar subida</h2>
      <p class="mt-2 text-sm leading-6 text-text-muted">
        Define la marca antes de guardar para que el asset llegue al etiquetado IA con el contexto correcto.
      </p>
    </div>

    <div class="space-y-5 overflow-y-auto px-6 py-6">
      <div>
        <div
          v-if="selectedUploadFiles.length === 1 && selectedUploadFiles[0] && filePreviewUrl"
          class="group relative overflow-hidden rounded-xl border border-border bg-surface-2"
        >
          <img
            :src="filePreviewUrl"
            :alt="selectedUploadFiles[0].name"
            class="h-44 w-full object-cover"
          >
          <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
            <label
              class="cursor-pointer rounded-lg border border-white/30 bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-sm transition hover:bg-black/70"
              :class="{ 'pointer-events-none opacity-60': uploading }"
            >
              <input ref="fileInputRef" class="hidden" type="file" accept="image/*" multiple :disabled="uploading" @change="onFileChange">
              Cambiar archivos
            </label>
          </div>
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-6">
            <p class="truncate font-mono text-xs text-white/80">{{ selectedUploadFiles[0].name }}</p>
            <p class="font-mono text-[10px] text-white/50">{{ formatAssetFileSize(selectedUploadFiles[0].size) }}</p>
          </div>
        </div>

        <div
          v-else-if="selectedUploadFiles.length > 1"
          class="rounded-xl border border-border bg-surface-2 p-4"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm text-text">{{ selectedUploadFiles.length }} archivos listos para subir</p>
              <p class="mt-1 font-mono text-[10px] text-text-muted">{{ selectedFilesTotalSize }}</p>
            </div>
            <label
              class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted transition hover:border-accent/40 hover:text-text"
              :class="{ 'pointer-events-none opacity-60': uploading }"
            >
              <input ref="fileInputRef" class="hidden" type="file" accept="image/*" multiple :disabled="uploading" @change="onFileChange">
              Cambiar archivos
            </label>
          </div>

          <div class="mt-4 grid gap-2 sm:grid-cols-2">
            <div
              v-for="file in selectedUploadFiles"
              :key="`${file.name}-${file.size}-${file.lastModified}`"
              class="rounded-lg border border-border bg-surface px-3 py-2"
            >
              <p class="truncate text-xs text-text">{{ file.name }}</p>
              <p class="mt-0.5 font-mono text-[10px] text-text-muted">{{ formatAssetFileSize(file.size) }}</p>
            </div>
          </div>
        </div>

        <section
          v-else
          class="rounded-xl border border-dashed transition"
          :class="isDragging ? 'border-accent bg-accent/5' : 'border-border bg-surface-2/40'"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDrop"
        >
          <div class="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-xl transition"
              :class="isDragging ? 'bg-accent/20 text-accent' : 'bg-surface text-text-muted'"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            </div>
            <div>
              <p class="text-sm text-text">
                {{ isDragging ? 'Suelta el archivo aqui' : 'Arrastra una imagen o selecciona un archivo' }}
              </p>
              <p class="mt-1 text-xs text-text-muted">JPG, PNG, WebP o GIF</p>
            </div>
            <label
              class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-muted transition hover:border-accent/40 hover:text-text"
              :class="{ 'pointer-events-none opacity-60': uploading }"
            >
              <input ref="fileInputRef" class="hidden" type="file" accept="image/*" multiple :disabled="uploading" @change="onFileChange">
              Elegir archivos
            </label>
          </div>
        </section>
      </div>

      <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <label class="block text-xs font-medium text-text-muted">
          Nombre
          <AppInput
            v-model="uploadName"
            class="mt-1.5"
            type="text"
            placeholder="Ej. Packshot botella frontal"
            :disabled="selectedUploadFiles.length > 1"
          />
          <span v-if="selectedUploadFiles.length > 1" class="mt-1 block text-[11px] text-text-muted">
            Con multiples archivos se usa el nombre de cada archivo automaticamente.
          </span>
        </label>

        <label class="block text-xs font-medium text-text-muted">
          Marca
          <AppSelect v-model="uploadBrandId" class="mt-1.5">
            <option value="">Global</option>
            <option v-for="brand in brands" :key="brand.id" :value="String(brand.id)">
              {{ brand.name }}
            </option>
          </AppSelect>
        </label>
      </div>

      <div
        v-if="selectedUploadFiles.length > 1"
        class="rounded-lg border border-accent/20 bg-accent/6 px-3 py-2.5 text-sm text-text-muted"
      >
        Subir varios assets puede tardar un poco mas porque se generan descripcion y tags para cada uno.
        <span v-if="uploadBrandId" class="text-text"> Todos se asociaran a la marca seleccionada.</span>
      </div>

      <div
        v-if="uploadModalError"
        class="rounded-lg border border-danger/30 bg-danger/8 px-3 py-2.5 text-sm text-danger"
      >
        {{ uploadModalError }}
      </div>
    </div>

    <div class="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
      <button
        type="button"
        class="rounded-lg border border-border px-4 py-2.5 text-sm text-text-muted transition hover:border-accent/30 hover:text-text disabled:opacity-50"
        :disabled="uploading"
        @click="handleClose"
      >
        Cancelar
      </button>
      <AppButton :disabled="uploading || !selectedUploadFiles.length" @click="submitUpload">
        {{ uploading ? 'Subiendo...' : selectedUploadFiles.length > 1 ? `Subir ${selectedUploadFiles.length} assets` : 'Subir asset' }}
      </AppButton>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import type { AssetUploadResponse } from '../../../shared/types/assets'
import type { BrandOption } from '../../../shared/types/brands'

import AppButton from '~/components/base/AppButton.vue'
import AppInput from '~/components/base/AppInput.vue'
import AppModal from '~/components/base/AppModal.vue'
import AppSelect from '~/components/base/AppSelect.vue'
import { getRequestErrorMessage } from '~/utils/http-errors'
import { formatAssetFileSize, prettifyAssetFilename } from '~/utils/assets'

const props = defineProps<{
  open: boolean
  brands: BrandOption[]
}>()

const emit = defineEmits<{
  close: []
  uploaded: [response: AssetUploadResponse]
}>()

const uploadName = ref('')
const uploadBrandId = ref('')
const selectedUploadFiles = ref<File[]>([])
const uploading = ref(false)
const isDragging = ref(false)
const uploadModalError = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const filePreviewUrl = ref<string | null>(null)

const selectedFilesTotalSize = computed(() => formatAssetFileSize(
  selectedUploadFiles.value.reduce((sum, file) => sum + file.size, 0)
))

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    resetUploadForm()
  }
})

watch(selectedUploadFiles, (newFiles) => {
  if (filePreviewUrl.value) {
    URL.revokeObjectURL(filePreviewUrl.value)
    filePreviewUrl.value = null
  }

  if (newFiles.length === 1) {
    filePreviewUrl.value = URL.createObjectURL(newFiles[0])
  }
})

onUnmounted(() => {
  if (filePreviewUrl.value) {
    URL.revokeObjectURL(filePreviewUrl.value)
  }
})

function resetUploadForm() {
  uploadName.value = ''
  uploadBrandId.value = ''
  selectedUploadFiles.value = []
  uploadModalError.value = ''
  isDragging.value = false

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function handleClose() {
  if (uploading.value) {
    return
  }

  resetUploadForm()
  emit('close')
}

function setUploadFiles(files: File[]) {
  const imageFiles = files.filter(file => file.type.startsWith('image/'))

  if (!imageFiles.length) {
    uploadModalError.value = 'Solo se permiten archivos de imagen.'
    return
  }

  selectedUploadFiles.value = imageFiles
  uploadModalError.value = ''

  if (imageFiles.length === 1 && !uploadName.value.trim()) {
    uploadName.value = prettifyAssetFilename(imageFiles[0].name)
  }

  if (imageFiles.length > 1) {
    uploadName.value = ''
  }
}

async function uploadFiles(files: File[]) {
  const formData = new FormData()

  for (const file of files) {
    formData.append('files', file)
  }

  if (files.length === 1) {
    formData.append('name', uploadName.value.trim() || prettifyAssetFilename(files[0].name))
  }

  if (uploadBrandId.value) {
    formData.append('brandId', uploadBrandId.value)
  }

  uploading.value = true

  try {
    const response = await $fetch<AssetUploadResponse>('/api/assets', {
      method: 'POST',
      body: formData
    })

    resetUploadForm()
    emit('uploaded', response)
    emit('close')
  } catch (error) {
    uploadModalError.value = getRequestErrorMessage(error, 'No se pudo completar la accion sobre el asset.', {
      includeMessage: false
    })
  } finally {
    uploading.value = false
  }
}

async function submitUpload() {
  if (!selectedUploadFiles.value.length) {
    uploadModalError.value = 'Selecciona al menos un archivo antes de subirlo.'
    return
  }

  await uploadFiles(selectedUploadFiles.value)
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement | null

  if (input?.files?.length) {
    setUploadFiles(Array.from(input.files))
  }
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  const files = event.dataTransfer?.files

  if (files?.length) {
    setUploadFiles(Array.from(files))
  }
}
</script>

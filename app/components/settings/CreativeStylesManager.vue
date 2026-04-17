<template>
  <section class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
    <div class="border-b border-border px-6 py-5">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">Biblioteca creativa</p>
          <h3 class="mt-2 text-xl text-text">Estilos creativos</h3>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            Define estilos que Gemini puede considerar cuando no exista una guia de estilo seleccionada.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-text-muted">
            {{ styles.length }} {{ styles.length === 1 ? 'estilo' : 'estilos' }}
          </span>
          <span class="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-text-muted">
            {{ activeCount }} activos
          </span>
          </div>

        </div>
    </div>

    <div class="grid gap-6 p-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <section class="overflow-hidden rounded-xl border border-border bg-surface-2/30">
        <div class="border-b border-border px-4 py-3">
          <div class="flex items-center justify-between gap-3">
            <h4 class="text-sm font-medium text-text">Disponibles</h4>

            <button
              type="button"
              class="flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-xs text-text-muted transition hover:border-accent/40 hover:text-text"
              @click="startCreate"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Nuevo
            </button>
          </div>

          <div v-if="styles.length > 3" class="mt-3">
            <AppInput
              v-model="listSearch"
              placeholder="Filtrar por nombre..."
              class="!py-2 !text-xs"
            />
          </div>
        </div>

        <div v-if="filteredStyles.length" class="max-h-[540px] overflow-y-auto p-2">
          <button
            v-for="style in filteredStyles"
            :key="style.id"
            type="button"
            class="mb-1.5 w-full rounded-lg border px-3 py-3 text-left transition last:mb-0"
            :class="selectedStyleId === style.id ? 'border-accent/40 bg-accent/8' : 'border-transparent hover:bg-surface-2'"
            @click="selectStyle(style.id)"
          >
            <div class="flex items-start gap-3">
              <img
                v-if="style.referenceImageUrl"
                :src="style.referenceImageUrl"
                :alt="style.name"
                class="h-14 w-14 shrink-0 rounded-lg border border-border object-cover"
              >
              <div v-else class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-muted">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="min-w-0 flex-1 truncate text-sm text-text">{{ style.name }}</p>
                  <span
                    class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    :class="style.isActive ? 'bg-accent/12 text-accent' : 'bg-surface text-text-muted'"
                  >
                    {{ style.isActive ? 'Activo' : 'Pausado' }}
                  </span>
                </div>
                <p v-if="style.description" class="mt-1.5 line-clamp-2 text-xs leading-5 text-text-muted">
                  {{ style.description }}
                </p>
              </div>
            </div>
          </button>
        </div>

        <div v-else-if="listSearch" class="px-4 py-8 text-center text-sm text-text-muted">
          Sin resultados para "{{ listSearch }}"
        </div>

        <div v-else class="px-5 py-10 text-center text-sm text-text-muted">
          Todavia no hay estilos creativos configurados.
        </div>
      </section>

      <section class="overflow-hidden rounded-xl border border-border bg-surface">
        <div class="border-b border-border px-5 py-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
                {{ selectedStyleId === null ? 'Nuevo estilo' : 'Editar estilo' }}
              </p>
              <h4 class="mt-1.5 text-lg text-text">
                {{ form.name || 'Sin nombre' }}
              </h4>
            </div>

            <span class="text-xs text-text-muted">
              Orden {{ form.position }}
            </span>

            <button
              v-if="selectedStyleId !== null"
              type="button"
              class="rounded border border-danger/30 px-3 py-1.5 text-xs text-danger transition hover:border-danger hover:bg-danger/8"
              :disabled="saving"
              @click="removeStyle"
            >
              Eliminar
            </button>
          </div>
        </div>

        <form class="space-y-5 px-5 py-5" @submit.prevent="saveStyle">
          <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_120px_140px]">
            <label class="block text-xs font-medium text-text-muted">
              Nombre
              <AppInput v-model="form.name" class="mt-1.5" maxlength="120" placeholder="Ej. Editorial minimalista" />
            </label>

            <label class="block text-xs font-medium text-text-muted">
              Orden
              <AppInput v-model="positionValue" class="mt-1.5" type="number" min="0" />
            </label>

            <label class="block text-xs font-medium text-text-muted">
              Estado
              <AppSelect v-model="activeValue" class="mt-1.5">
                <option value="true">Activo</option>
                <option value="false">Pausado</option>
              </AppSelect>
            </label>
          </div>

          <label class="block text-xs font-medium text-text-muted">
            Descripcion breve
            <AppTextarea
              v-model="form.description"
              class="mt-1.5"
              :rows="5"
              placeholder="Describe la atmosfera, composicion, tipo de luz o territorio visual para ayudar a Gemini a elegirlo bien."
            />
          </label>

          <div class="rounded-xl border border-border bg-surface-2/30 p-4">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p class="text-sm text-text">Referencia visual</p>
                <p class="mt-1 text-sm leading-6 text-text-muted">
                  Opcional. Sirve para que el equipo entienda el estilo y para documentarlo mejor en Settings.
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onReferenceSelected">
                <button
                  type="button"
                  class="rounded border border-border px-3 py-2 text-sm text-text-muted transition hover:border-accent/35 hover:text-text disabled:opacity-50"
                  :disabled="selectedStyleId === null || uploadingReference"
                  @click="fileInputRef?.click()"
                >
                  {{ uploadingReference ? 'Subiendo...' : form.referenceImageUrl ? 'Reemplazar imagen' : 'Subir imagen' }}
                </button>

                <button
                  v-if="form.referenceImageUrl"
                  type="button"
                  class="rounded border border-danger/35 px-3 py-2 text-sm text-danger transition hover:bg-danger/10 disabled:opacity-50"
                  :disabled="selectedStyleId === null || uploadingReference"
                  @click="removeReference"
                >
                  Quitar imagen
                </button>
              </div>
            </div>

            <div v-if="form.referenceImageUrl" class="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
              <img :src="form.referenceImageUrl" :alt="form.name || 'Referencia visual'" class="h-52 w-full object-cover">
            </div>
          </div>

          <div class="flex items-center justify-between gap-4 border-t border-border pt-5">
            <button
              type="button"
              class="text-xs text-text-muted transition hover:text-text"
              @click="resetForm"
            >
              {{ selectedStyleId === null ? 'Limpiar' : 'Descartar cambios' }}
            </button>

            <div class="flex items-center gap-3">
              <p v-if="feedback" class="text-xs" :class="feedbackClass">
                {{ feedback }}
              </p>

              <AppButton type="submit" :disabled="saving || !canSave">
                {{ saving ? 'Guardando...' : selectedStyleId === null ? 'Crear' : 'Guardar' }}
              </AppButton>
            </div>
          </div>
        </form>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import type {
  CreativeStyleInput,
  CreativeStyleRecord,
  CreativeStyleResponse,
  CreativeStylesResponse
} from '../../../shared/types/creative-styles'

import AppButton from '~/components/base/AppButton.vue'
import AppInput from '~/components/base/AppInput.vue'
import AppSelect from '~/components/base/AppSelect.vue'
import AppTextarea from '~/components/base/AppTextarea.vue'
import { getRequestErrorMessage } from '~/utils/http-errors'

const props = defineProps<{
  modelValue: CreativeStyleRecord[]
}>()

const emit = defineEmits<{
  'update:modelValue': [styles: CreativeStyleRecord[]]
}>()

const selectedStyleId = ref<number | null>(props.modelValue[0]?.id ?? null)
const saving = ref(false)
const uploadingReference = ref(false)
const feedback = ref('')
const feedbackTone = ref<'success' | 'error'>('success')
const fileInputRef = ref<HTMLInputElement | null>(null)
const listSearch = ref('')

const form = reactive({
  name: '',
  description: '',
  position: 0,
  isActive: true,
  referenceImageUrl: null as string | null
})

const styles = computed(() => props.modelValue)
const activeCount = computed(() => styles.value.filter((style) => style.isActive).length)
const canSave = computed(() => Boolean(form.name.trim()))
const feedbackClass = computed(() => feedbackTone.value === 'success' ? 'text-accent' : 'text-danger')

const filteredStyles = computed(() => {
  const term = listSearch.value.trim().toLowerCase()

  if (!term) {
    return styles.value
  }

  return styles.value.filter((style) => {
    return [style.name, style.description]
      .join(' ')
      .toLowerCase()
      .includes(term)
  })
})

const positionValue = computed<string>({
  get() {
    return String(form.position)
  },
  set(value: string) {
    const parsed = Number(value)
    form.position = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
  }
})

const activeValue = computed<string>({
  get() {
    return form.isActive ? 'true' : 'false'
  },
  set(value: string) {
    form.isActive = value === 'true'
  }
})

watch(() => props.modelValue, (nextStyles) => {
  if (!nextStyles.length) {
    startCreate()
    return
  }

  if (selectedStyleId.value === null || !nextStyles.some((style) => style.id === selectedStyleId.value)) {
    hydrateForm(nextStyles[0]!.id)
  }
}, { immediate: true })

function sortStyles(nextStyles: CreativeStyleRecord[]) {
  return [...nextStyles].sort((left, right) => left.position - right.position || left.name.localeCompare(right.name, 'es'))
}

function hydrateForm(styleId: number) {
  const style = styles.value.find((entry) => entry.id === styleId)

  if (!style) {
    return
  }

  selectedStyleId.value = style.id
  form.name = style.name
  form.description = style.description
  form.position = style.position
  form.isActive = style.isActive
  form.referenceImageUrl = style.referenceImageUrl
  feedback.value = ''
}

function selectStyle(styleId: number) {
  hydrateForm(styleId)
}

function startCreate() {
  selectedStyleId.value = null
  form.name = ''
  form.description = ''
  form.position = styles.value.length
  form.isActive = true
  form.referenceImageUrl = null
  feedback.value = ''
}

function resetForm() {
  if (selectedStyleId.value !== null) {
    hydrateForm(selectedStyleId.value)
    return
  }

  startCreate()
}

function getPayload(): CreativeStyleInput {
  return {
    name: form.name,
    description: form.description,
    position: form.position,
    isActive: form.isActive
  }
}

function updateStyles(nextStyles: CreativeStyleRecord[]) {
  emit('update:modelValue', sortStyles(nextStyles))
}

async function removeStyle() {
  if (selectedStyleId.value === null) {
    return
  }

  const confirmed = window.confirm('Se eliminara este estilo creativo. Esta accion no se puede deshacer.')

  if (!confirmed) {
    return
  }

  saving.value = true
  feedback.value = ''

  try {
    const deletedId = selectedStyleId.value

    await $fetch(`/api/creative-styles/${deletedId}`, {
      method: 'DELETE'
    })

    const remaining = styles.value.filter((style) => style.id !== deletedId)
    updateStyles(remaining)

    feedbackTone.value = 'success'
    feedback.value = 'Estilo eliminado.'

    if (remaining.length > 0) {
      hydrateForm(remaining[0]!.id)
    } else {
      startCreate()
    }
  }
  catch (error) {
    feedback.value = getRequestErrorMessage(error, 'No se pudo eliminar el estilo creativo.')
    feedbackTone.value = 'error'
  }
  finally {
    saving.value = false
  }
}

async function saveStyle() {
  if (!canSave.value) {
    feedback.value = 'Completa al menos el nombre del estilo.'
    feedbackTone.value = 'error'
    return
  }

  saving.value = true
  feedback.value = ''

  try {
    const payload = getPayload()

    if (selectedStyleId.value === null) {
      const response = await $fetch<CreativeStyleResponse>('/api/creative-styles', {
        method: 'POST',
        body: payload
      })

      updateStyles([...styles.value, response.style])
      hydrateForm(response.style.id)
      feedback.value = 'Estilo creado.'
    } else {
      const response = await $fetch<CreativeStyleResponse>(`/api/creative-styles/${selectedStyleId.value}`, {
        method: 'PUT',
        body: payload
      })

      updateStyles(styles.value.map((style) => style.id === response.style.id ? response.style : style))
      hydrateForm(response.style.id)
      feedback.value = 'Estilo actualizado.'
    }

    feedbackTone.value = 'success'
  }
  catch (error) {
    feedback.value = getRequestErrorMessage(error, 'No se pudo guardar el estilo creativo.')
    feedbackTone.value = 'error'
  }
  finally {
    saving.value = false
  }
}

async function uploadReference(file: File) {
  if (selectedStyleId.value === null) {
    feedback.value = 'Guarda el estilo antes de subir una referencia.'
    feedbackTone.value = 'error'
    return
  }

  uploadingReference.value = true
  feedback.value = ''

  try {
    const formData = new FormData()
    formData.set('file', file)

    const response = await $fetch<CreativeStyleResponse>(`/api/creative-styles/${selectedStyleId.value}/reference`, {
      method: 'POST',
      body: formData
    })

    updateStyles(styles.value.map((style) => style.id === response.style.id ? response.style : style))
    hydrateForm(response.style.id)
    feedback.value = 'Referencia actualizada.'
    feedbackTone.value = 'success'
  }
  catch (error) {
    feedback.value = getRequestErrorMessage(error, 'No se pudo subir la referencia visual.')
    feedbackTone.value = 'error'
  }
  finally {
    uploadingReference.value = false

    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

async function removeReference() {
  if (selectedStyleId.value === null || !form.referenceImageUrl) {
    return
  }

  uploadingReference.value = true
  feedback.value = ''

  try {
    const response = await $fetch<CreativeStyleResponse>(`/api/creative-styles/${selectedStyleId.value}/reference`, {
      method: 'DELETE'
    })

    updateStyles(styles.value.map((style) => style.id === response.style.id ? response.style : style))
    hydrateForm(response.style.id)
    feedback.value = 'Referencia eliminada.'
    feedbackTone.value = 'success'
  }
  catch (error) {
    feedback.value = getRequestErrorMessage(error, 'No se pudo eliminar la referencia visual.')
    feedbackTone.value = 'error'
  }
  finally {
    uploadingReference.value = false
  }
}

function onReferenceSelected(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]

  if (file) {
    void uploadReference(file)
  }
}
</script>

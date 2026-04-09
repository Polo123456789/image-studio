<template>
  <div class="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
    <div class="mx-auto max-w-7xl">
      <!-- Page header -->
      <header class="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Guias de estilo</p>
          <h1 class="mt-3 font-display text-3xl text-text">Biblioteca de guias</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            Documentos markdown reutilizables para direccion visual. Cada guia puede ser global o estar asociada a una marca.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs tabular-nums text-text-muted">
            {{ guides.length }} {{ guides.length === 1 ? 'guia' : 'guias' }}
          </span>
          <span class="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs tabular-nums text-text-muted">
            {{ globalGuidesCount }} globales
          </span>
          <span class="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs tabular-nums text-text-muted">
            {{ brandGuidesCount }} de marca
          </span>
        </div>
      </header>

      <!-- Loading state -->
      <div v-if="pending" class="rounded-2xl border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">
        Cargando guias de estilo...
      </div>

      <!-- Main layout -->
      <div v-else class="space-y-6">
        <!-- Reverse engineering CTA banner -->
        <section class="overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/[0.06] to-transparent shadow-sm">
          <div class="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex items-start gap-4">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/12">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-accent"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-6" /><path d="M9 15l3-3 3 3" /></svg>
              </div>
              <div>
                <h2 class="text-base font-medium text-text">Reconstruir una guia desde referencias</h2>
                <p class="mt-1.5 max-w-xl text-sm leading-6 text-text-muted">
                  Sube posts o anuncios temporales de una marca, deja que Gemini Flash sintetice el patron visual
                  y guarda el resultado en la biblioteca solo si vale la pena.
                </p>
              </div>
            </div>

            <NuxtLink
              to="/styles/reverse-engineer"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-90"
            >
              Abrir ingenieria inversa
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </NuxtLink>
          </div>
        </section>

        <!-- Content grid: list + editor -->
        <div class="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <!-- ─── List panel ─────────────────────────────────────────── -->
          <section class="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <!-- List header with search -->
            <div class="border-b border-border px-5 py-4">
              <div class="flex items-center justify-between gap-3">
                <h2 class="text-sm font-medium text-text">Guardadas</h2>

                <button
                  type="button"
                  class="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-text-muted transition hover:border-accent/40 hover:text-text"
                  @click="startCreate"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Nueva
                </button>
              </div>

              <!-- Search -->
              <div v-if="guides.length > 3" class="mt-3">
                <AppInput
                  v-model="listSearch"
                  placeholder="Filtrar por nombre o marca..."
                  class="!py-2 !text-xs"
                />
              </div>
            </div>

            <!-- Guide cards -->
            <div v-if="filteredGuides.length" class="max-h-[65vh] flex-1 overflow-y-auto p-2">
              <button
                v-for="guide in filteredGuides"
                :key="guide.id"
                type="button"
                class="mb-1.5 w-full rounded-xl border px-4 py-3.5 text-left transition last:mb-0"
                :class="selectedGuideId === guide.id
                  ? 'border-accent/40 bg-accent/8'
                  : 'border-transparent hover:bg-surface-2/70'"
                @click="selectGuide(guide.id)"
              >
                <div class="flex items-center gap-2">
                  <p class="min-w-0 flex-1 truncate text-sm text-text">{{ guide.name }}</p>
                  <span
                    class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    :class="guide.brandId
                      ? 'bg-accent/12 text-accent'
                      : 'bg-surface-2 text-text-muted'"
                  >
                    {{ guide.brandId ? (guide.brandName ?? 'Marca') : 'Global' }}
                  </span>
                </div>
                <p class="mt-2 line-clamp-2 whitespace-pre-wrap text-xs leading-4 text-text-muted">
                  {{ guide.content }}
                </p>
              </button>
            </div>

            <!-- No results for search -->
            <div v-else-if="listSearch && guides.length" class="px-5 py-10 text-center text-sm text-text-muted">
              Sin resultados para "{{ listSearch }}"
            </div>

            <!-- Empty library -->
            <div v-else class="flex flex-col items-center gap-4 px-6 py-14 text-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-text-muted"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
              </div>
              <div>
                <p class="text-sm text-text">Biblioteca vacia</p>
                <p class="mt-1.5 text-xs leading-5 text-text-muted">
                  Crea la primera guia para reutilizarla en el estudio.
                </p>
              </div>
            </div>
          </section>

          <!-- ─── Editor panel ───────────────────────────────────────── -->
          <section class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <!-- Editor header -->
            <div class="border-b border-border px-6 py-5">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
                    {{ isEditing ? 'Editando' : 'Nueva guia' }}
                  </p>
                  <h2 class="mt-1.5 text-xl text-text">
                    {{ isEditing ? form.name || 'Sin nombre' : 'Crear guia de estilo' }}
                  </h2>
                </div>

                <div v-if="isEditing" class="flex items-center gap-2">
                  <button
                    type="button"
                    class="rounded-lg border border-danger/30 px-3 py-1.5 text-xs text-danger transition hover:border-danger hover:bg-danger/8"
                    :disabled="saving"
                    @click="removeGuide"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>

            <!-- Editor form -->
            <form class="space-y-5 px-6 py-6" @submit.prevent="saveGuide">
              <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px]">
                <label class="block text-xs font-medium text-text-muted">
                  Nombre
                  <AppInput
                    v-model="form.name"
                    class="mt-1.5"
                    maxlength="120"
                    placeholder="Ej. Estilo editorial producto premium"
                  />
                </label>

                <label class="block text-xs font-medium text-text-muted">
                  Alcance
                  <AppSelect v-model="brandSelection" class="mt-1.5">
                    <option value="">Global</option>
                    <option v-for="brand in brandOptions" :key="brand.id" :value="String(brand.id)">
                      {{ brand.name }}
                    </option>
                  </AppSelect>
                </label>
              </div>

              <label class="block text-xs font-medium text-text-muted">
                Contenido
                <AppTextarea
                  v-model="form.content"
                  class="mt-1.5 min-h-[320px] font-mono text-[13px] leading-6"
                  :rows="16"
                  placeholder="# Direccion de arte&#10;&#10;- Paleta&#10;- Iluminacion&#10;- Restricciones&#10;- Composicion"
                />
              </label>

              <!-- Actions bar -->
              <div class="flex items-center justify-between gap-4 border-t border-border pt-5">
                <button
                  type="button"
                  class="text-xs text-text-muted transition hover:text-text"
                  @click="resetForm"
                >
                  {{ isEditing ? 'Descartar cambios' : 'Limpiar' }}
                </button>

                <div class="flex items-center gap-3">
                  <p v-if="feedback" class="text-xs" :class="feedbackClass">
                    {{ feedback }}
                  </p>

                  <AppButton type="submit" :disabled="saving || !canSave">
                    {{ saving ? 'Guardando...' : isEditing ? 'Guardar' : 'Crear' }}
                  </AppButton>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BrandOption } from '../../../shared/types/brands'
import type { StyleGuidePayload, StyleGuidesResponse } from '../../../shared/types/style-guides'

import AppButton from '~/components/base/AppButton.vue'
import AppInput from '~/components/base/AppInput.vue'
import AppSelect from '~/components/base/AppSelect.vue'
import AppTextarea from '~/components/base/AppTextarea.vue'

const { data, pending } = await useFetch<StyleGuidesResponse>('/api/style-guides')

const form = reactive({
  name: '',
  content: ''
})

const selectedGuideId = ref<number | null>(null)
const creatingGuide = ref(false)
const brandSelection = ref('')
const saving = ref(false)
const feedback = ref('')
const feedbackTone = ref<'success' | 'error'>('success')
const listSearch = ref('')

const guides = computed(() => data.value?.guides ?? [])
const brandOptions = computed<BrandOption[]>(() => data.value?.brands ?? [])
const selectedGuide = computed(() => guides.value.find((guide) => guide.id === selectedGuideId.value) ?? null)
const isEditing = computed(() => selectedGuide.value !== null && !creatingGuide.value)
const globalGuidesCount = computed(() => guides.value.filter((guide) => guide.brandId === null).length)
const brandGuidesCount = computed(() => guides.value.filter((guide) => guide.brandId !== null).length)

const canSave = computed(() => Boolean(form.name.trim() && form.content.trim()))
const feedbackClass = computed(() => feedbackTone.value === 'success' ? 'text-accent' : 'text-danger')

const filteredGuides = computed(() => {
  const term = listSearch.value.trim().toLowerCase()
  if (!term) return guides.value
  return guides.value.filter((guide) =>
    guide.name.toLowerCase().includes(term)
    || guide.brandName?.toLowerCase().includes(term)
  )
})

watchEffect(() => {
  if (!data.value) return

  if (selectedGuideId.value === null && !creatingGuide.value && data.value.guides.length > 0) {
    hydrateForm(data.value.guides[0].id)
  }

  if (selectedGuideId.value !== null && !data.value.guides.some((guide) => guide.id === selectedGuideId.value)) {
    if (data.value.guides.length > 0) {
      hydrateForm(data.value.guides[0].id)
      return
    }
    startCreate()
  }
})

function hydrateForm(guideId: number) {
  const guide = guides.value.find((entry) => entry.id === guideId)
  if (!guide) return

  creatingGuide.value = false
  selectedGuideId.value = guide.id
  form.name = guide.name
  form.content = guide.content
  brandSelection.value = guide.brandId === null ? '' : String(guide.brandId)
  feedback.value = ''
}

function selectGuide(guideId: number) {
  hydrateForm(guideId)
}

function startCreate() {
  creatingGuide.value = true
  selectedGuideId.value = null
  form.name = ''
  form.content = ''
  brandSelection.value = ''
  feedback.value = ''
}

function resetForm() {
  if (selectedGuideId.value !== null) {
    hydrateForm(selectedGuideId.value)
    return
  }
  startCreate()
}

function getPayload(): StyleGuidePayload {
  return {
    name: form.name,
    content: form.content,
    brandId: brandSelection.value ? Number(brandSelection.value) : null
  }
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const maybeStatusMessage = 'statusMessage' in error ? error.statusMessage : undefined
    if (typeof maybeStatusMessage === 'string' && maybeStatusMessage) return maybeStatusMessage

    const maybeData = 'data' in error ? error.data : undefined
    if (typeof maybeData === 'object' && maybeData !== null && 'statusMessage' in maybeData) {
      const nestedStatusMessage = maybeData.statusMessage
      if (typeof nestedStatusMessage === 'string' && nestedStatusMessage) return nestedStatusMessage
    }

    const maybeMessage = 'message' in error ? error.message : undefined
    if (typeof maybeMessage === 'string' && maybeMessage) return maybeMessage
  }
  return 'No se pudo guardar la guia.'
}

async function saveGuide() {
  if (!canSave.value) {
    feedback.value = 'Completa nombre y contenido antes de guardar.'
    feedbackTone.value = 'error'
    return
  }

  saving.value = true
  feedback.value = ''

  try {
    const payload = getPayload()

    if (selectedGuideId.value === null) {
      const created = await $fetch('/api/style-guides', {
        method: 'POST',
        body: payload
      })

      data.value = {
        guides: [created, ...guides.value],
        brands: brandOptions.value
      }
      creatingGuide.value = false
      hydrateForm(created.id)
      feedback.value = 'Guia creada.'
    } else {
      const updated = await $fetch(`/api/style-guides/${selectedGuideId.value}`, {
        method: 'PUT',
        body: payload
      })

      data.value = {
        guides: guides.value.map((guide) => guide.id === updated.id ? updated : guide),
        brands: brandOptions.value
      }
      hydrateForm(updated.id)
      feedback.value = 'Guia actualizada.'
    }

    feedbackTone.value = 'success'
  } catch (error) {
    feedback.value = getErrorMessage(error)
    feedbackTone.value = 'error'
  } finally {
    saving.value = false
  }
}

async function removeGuide() {
  if (selectedGuideId.value === null) return

  const confirmed = window.confirm('Se eliminara esta guia de estilo. Esta accion no se puede deshacer.')
  if (!confirmed) return

  saving.value = true
  feedback.value = ''

  try {
    const deletedId = selectedGuideId.value

    await $fetch(`/api/style-guides/${deletedId}`, {
      method: 'DELETE'
    })

    data.value = {
      guides: guides.value.filter((guide) => guide.id !== deletedId),
      brands: brandOptions.value
    }
    feedbackTone.value = 'success'
    feedback.value = 'Guia eliminada.'

    if (data.value.guides.length > 0) {
      hydrateForm(data.value.guides[0].id)
    } else {
      startCreate()
      feedback.value = 'Guia eliminada.'
    }
  } catch (error) {
    feedback.value = getErrorMessage(error)
    feedbackTone.value = 'error'
  } finally {
    saving.value = false
  }
}
</script>

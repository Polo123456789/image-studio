<template>
  <div class="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
    <div class="mx-auto max-w-7xl">
      <!-- Header -->
      <header class="mb-10">
        <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Marcas</p>
        <h1 class="mt-3 font-display text-3xl text-text">Gestion de marcas</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
          Define marcas como contexto reutilizable, con una guia por defecto
          y recursos propios que luego se priorizan en el studio.
        </p>

        <!-- Stats -->
        <div class="mt-5 flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2">
            <span class="font-mono text-lg text-text">{{ brands.length }}</span>
            <span class="text-xs text-text-muted">{{ brands.length === 1 ? 'marca' : 'marcas' }}</span>
          </div>
          <div class="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2">
            <span class="font-mono text-lg text-text">{{ brandsWithDefaultGuide }}</span>
            <span class="text-xs text-text-muted">con guia</span>
          </div>
          <div class="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2">
            <span class="font-mono text-lg text-text">{{ totalAssets }}</span>
            <span class="text-xs text-text-muted">assets propios</span>
          </div>
          <div class="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2">
            <span class="font-mono text-lg text-text">{{ totalGuides }}</span>
            <span class="text-xs text-text-muted">guias propias</span>
          </div>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="pending" class="rounded-xl border border-border bg-surface px-6 py-16 text-center text-sm text-text-muted">
        Cargando marcas...
      </div>

      <!-- Main layout -->
      <div v-else class="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <!-- List panel -->
        <section class="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-sm font-medium text-text">Registradas</h2>

              <button
                type="button"
                class="flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-xs text-text-muted transition hover:border-accent/40 hover:text-text"
                @click="startCreate"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Nueva
              </button>
            </div>

            <div v-if="brands.length > 3" class="mt-3">
              <AppInput
                v-model="listSearch"
                placeholder="Filtrar por nombre o guia..."
                class="!py-2 !text-xs"
              />
            </div>
          </div>

          <!-- Brand cards -->
          <div v-if="filteredBrands.length" class="max-h-[65vh] flex-1 overflow-y-auto p-2">
            <button
              v-for="brand in filteredBrands"
              :key="brand.id"
              type="button"
              class="mb-1.5 w-full rounded-lg border px-3.5 py-3 text-left transition last:mb-0"
              :class="selectedBrandId === brand.id
                ? 'border-accent/40 bg-accent/8'
                : 'border-transparent hover:bg-surface-2/70'"
              @click="selectBrand(brand.id)"
            >
              <div class="flex items-start gap-3">
                <!-- Brand initial -->
                <span
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-medium"
                  :class="selectedBrandId === brand.id
                    ? 'bg-accent/20 text-accent'
                    : 'bg-surface-2 text-text-muted'"
                >
                  {{ brand.name.charAt(0).toUpperCase() }}
                </span>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-2">
                    <p class="truncate text-sm text-text">{{ brand.name }}</p>
                    <span class="shrink-0 font-mono text-[10px] text-text-muted">
                      {{ brand.assetCount }}A &middot; {{ brand.styleGuideCount }}G
                    </span>
                  </div>

                  <p class="mt-0.5 text-xs text-text-muted">
                    <span v-if="brand.defaultStyleGuideName" class="inline-flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent"><polyline points="20 6 9 17 4 12" /></svg>
                      {{ brand.defaultStyleGuideName }}
                    </span>
                    <span v-else class="opacity-50">Sin guia por defecto</span>
                  </p>

                  <p v-if="brand.description" class="mt-1.5 line-clamp-2 text-xs leading-5 text-text-muted/70">
                    {{ brand.description }}
                  </p>
                </div>
              </div>
            </button>
          </div>

          <!-- No results for search -->
          <div v-else-if="listSearch" class="px-4 py-8 text-center text-sm text-text-muted">
            Sin resultados para "{{ listSearch }}"
          </div>

          <!-- Empty library -->
          <div v-else class="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div class="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-text-muted"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
            </div>
            <div>
              <p class="text-sm text-text">Todavia no hay marcas</p>
              <p class="mt-1 text-xs leading-4 text-text-muted">
                Crea la primera marca para reutilizar su contexto en el studio.
              </p>
            </div>
          </div>
        </section>

        <!-- Editor panel -->
        <section class="overflow-hidden rounded-xl border border-border bg-surface">
          <div class="border-b border-border px-5 py-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
                  {{ isEditing ? 'Editando' : 'Nueva marca' }}
                </p>
                <h2 class="mt-1.5 text-lg text-text">
                  {{ isEditing ? form.name || 'Sin nombre' : 'Crear marca' }}
                </h2>
              </div>

              <button
                v-if="isEditing"
                type="button"
                class="rounded border border-danger/30 px-3 py-1.5 text-xs text-danger transition hover:border-danger hover:bg-danger/8"
                :disabled="saving"
                @click="removeBrand"
              >
                Eliminar
              </button>
            </div>
          </div>

          <form class="space-y-5 px-5 py-5" @submit.prevent="saveBrand">
            <!-- Name + default guide -->
            <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <label class="block text-xs font-medium text-text-muted">
                Nombre
                <AppInput
                  v-model="form.name"
                  class="mt-1.5"
                  maxlength="120"
                  placeholder="Ej. Verda, Orbit, Casa Atlas"
                />
              </label>

              <label class="block text-xs font-medium text-text-muted">
                Guia por defecto
                <AppSelect v-model="defaultStyleGuideSelection" class="mt-1.5">
                  <option value="">Sin guia asignada</option>
                  <option v-for="guide in availableDefaultGuides" :key="guide.id" :value="String(guide.id)">
                    {{ guide.name }}
                  </option>
                </AppSelect>
              </label>
            </div>

            <!-- Description -->
            <label class="block text-xs font-medium text-text-muted">
              Descripcion
              <AppTextarea
                v-model="form.description"
                class="mt-1.5"
                :rows="5"
                placeholder="Tono, territorio visual, productos o reglas que distinguen a esta marca."
              />
            </label>

            <!-- Visible resources summary -->
            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-xl border border-border bg-surface-2/40 p-4">
                <div class="flex items-center gap-2">
                  <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-2 text-text-muted">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                  </div>
                  <p class="text-xs font-medium text-text">Guias visibles</p>
                  <span class="ml-auto font-mono text-xs text-accent">{{ visibleGuidesCount }}</span>
                </div>
                <p class="mt-2 text-xs leading-5 text-text-muted">
                  {{ visibleGuidesSummary }}
                </p>
              </div>

              <div class="rounded-xl border border-border bg-surface-2/40 p-4">
                <div class="flex items-center gap-2">
                  <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-2 text-text-muted">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg>
                  </div>
                  <p class="text-xs font-medium text-text">Assets visibles</p>
                  <span class="ml-auto font-mono text-xs text-accent">{{ visibleAssetsCount }}</span>
                </div>
                <p class="mt-2 text-xs leading-5 text-text-muted">
                  {{ visibleAssetsSummary }}
                </p>
              </div>
            </div>

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
</template>

<script setup lang="ts">
import type { AssetRecord, AssetsResponse } from '../../shared/types/assets'
import type { BrandPayload, BrandRecord, BrandsResponse } from '../../shared/types/brands'
import type { StyleGuideRecord, StyleGuidesResponse } from '../../shared/types/style-guides'

import AppButton from '~/components/base/AppButton.vue'
import AppInput from '~/components/base/AppInput.vue'
import AppSelect from '~/components/base/AppSelect.vue'
import AppTextarea from '~/components/base/AppTextarea.vue'
import { getRequestErrorMessage } from '~/utils/http-errors'

const { data, pending } = await useFetch<BrandsResponse>('/api/brands')
const { data: styleGuideData } = await useFetch<StyleGuidesResponse>('/api/style-guides')
const { data: assetData } = await useFetch<AssetsResponse>('/api/assets')

const form = reactive({
  name: '',
  description: ''
})

const selectedBrandId = ref<number | null>(null)
const creatingBrand = ref(false)
const defaultStyleGuideSelection = ref('')
const saving = ref(false)
const feedback = ref('')
const feedbackTone = ref<'success' | 'error'>('success')
const listSearch = ref('')

const brands = computed(() => data.value?.brands ?? [])
const guides = computed<StyleGuideRecord[]>(() => styleGuideData.value?.guides ?? [])
const assets = computed<AssetRecord[]>(() => assetData.value?.assets ?? [])
const selectedBrand = computed(() => brands.value.find((brand) => brand.id === selectedBrandId.value) ?? null)
const isEditing = computed(() => selectedBrand.value !== null && !creatingBrand.value)
const canSave = computed(() => Boolean(form.name.trim()))
const feedbackClass = computed(() => feedbackTone.value === 'success' ? 'text-accent' : 'text-danger')
const brandsWithDefaultGuide = computed(() => brands.value.filter((brand) => brand.defaultStyleGuideId !== null).length)
const totalAssets = computed(() => brands.value.reduce((sum, brand) => sum + brand.assetCount, 0))
const totalGuides = computed(() => brands.value.reduce((sum, brand) => sum + brand.styleGuideCount, 0))

const filteredBrands = computed(() => {
  const term = listSearch.value.trim().toLowerCase()

  if (!term) {
    return brands.value
  }

  return brands.value.filter((brand) => {
    return [brand.name, brand.description || '', brand.defaultStyleGuideName || '']
      .join(' ')
      .toLowerCase()
      .includes(term)
  })
})

const availableDefaultGuides = computed(() => {
  return guides.value.filter((guide) => {
    if (guide.brandId === null) {
      return true
    }

    return selectedBrandId.value !== null && guide.brandId === selectedBrandId.value
  })
})

const visibleGuidesCount = computed(() => {
  return selectedBrandId.value === null
    ? guides.value.filter((guide) => guide.brandId === null).length
    : guides.value.filter((guide) => guide.brandId === null || guide.brandId === selectedBrandId.value).length
})

const visibleGuidesSummary = computed(() => {
  return selectedBrandId.value === null
    ? 'Guias globales disponibles al crear la marca. Despues podras agregar guias propias y seguir reutilizando las globales.'
    : 'Guias visibles entre globales y propias. La guia asignada se aplica por defecto cuando esta marca se selecciona en el studio.'
})

const visibleAssetsCount = computed(() => {
  return selectedBrandId.value === null
    ? assets.value.filter((asset) => asset.brandId === null).length
    : assets.value.filter((asset) => asset.brandId === null || asset.brandId === selectedBrandId.value).length
})

const visibleAssetsSummary = computed(() => {
  return selectedBrandId.value === null
    ? 'Assets globales reutilizables. Los assets propios se suman una vez creada la marca.'
    : 'Assets visibles entre globales y propios. En el studio, los assets de esta marca salen primero al abrir el selector.'
})

watch(availableDefaultGuides, (nextGuides) => {
  if (!defaultStyleGuideSelection.value) {
    return
  }

  if (!nextGuides.some((guide) => String(guide.id) === defaultStyleGuideSelection.value)) {
    defaultStyleGuideSelection.value = ''
  }
})

watchEffect(() => {
  if (!data.value) {
    return
  }

  if (selectedBrandId.value === null && !creatingBrand.value && data.value.brands.length > 0) {
    hydrateForm(data.value.brands[0].id)
    return
  }

  if (selectedBrandId.value !== null && !data.value.brands.some((brand) => brand.id === selectedBrandId.value)) {
    if (data.value.brands.length > 0) {
      hydrateForm(data.value.brands[0].id)
      return
    }

    startCreate()
  }
})

function hydrateForm(brandId: number) {
  const brand = brands.value.find((entry) => entry.id === brandId)

  if (!brand) {
    return
  }

  creatingBrand.value = false
  selectedBrandId.value = brand.id
  form.name = brand.name
  form.description = brand.description || ''
  defaultStyleGuideSelection.value = brand.defaultStyleGuideId === null ? '' : String(brand.defaultStyleGuideId)
  feedback.value = ''
}

function selectBrand(brandId: number) {
  hydrateForm(brandId)
}

function startCreate() {
  creatingBrand.value = true
  selectedBrandId.value = null
  form.name = ''
  form.description = ''
  defaultStyleGuideSelection.value = ''
  feedback.value = ''
}

function resetForm() {
  if (selectedBrandId.value !== null) {
    hydrateForm(selectedBrandId.value)
    return
  }

  startCreate()
}

function getPayload(): BrandPayload {
  return {
    name: form.name,
    description: form.description,
    defaultStyleGuideId: defaultStyleGuideSelection.value ? Number(defaultStyleGuideSelection.value) : null
  }
}

function getErrorMessage(error: unknown) {
  return getRequestErrorMessage(error, 'No se pudo guardar la marca.')
}

async function saveBrand() {
  if (!canSave.value) {
    feedback.value = 'Completa al menos el nombre antes de guardar.'
    feedbackTone.value = 'error'
    return
  }

  saving.value = true
  feedback.value = ''

  try {
    const payload = getPayload()

    if (selectedBrandId.value === null) {
      const created = await $fetch<BrandRecord>('/api/brands', {
        method: 'POST',
        body: payload
      })

      data.value = {
        brands: [created, ...brands.value]
      }
      creatingBrand.value = false
      hydrateForm(created.id)
      feedback.value = 'Marca creada.'
    } else {
      const updated = await $fetch<BrandRecord>(`/api/brands/${selectedBrandId.value}`, {
        method: 'PUT',
        body: payload
      })

      data.value = {
        brands: brands.value.map((brand) => brand.id === updated.id ? updated : brand)
      }
      hydrateForm(updated.id)
      feedback.value = 'Marca actualizada.'
    }

    feedbackTone.value = 'success'
  } catch (error) {
    feedback.value = getErrorMessage(error)
    feedbackTone.value = 'error'
  } finally {
    saving.value = false
  }
}

async function removeBrand() {
  if (selectedBrandId.value === null) {
    return
  }

  const confirmed = window.confirm('Se eliminara esta marca. Sus assets y guias quedaran globales. Esta accion no se puede deshacer.')

  if (!confirmed) {
    return
  }

  saving.value = true
  feedback.value = ''

  try {
    const deletedId = selectedBrandId.value

    await $fetch(`/api/brands/${deletedId}`, {
      method: 'DELETE'
    })

    data.value = {
      brands: brands.value.filter((brand) => brand.id !== deletedId)
    }

    feedbackTone.value = 'success'
    feedback.value = 'Marca eliminada. Sus recursos quedaron disponibles como globales.'

    if (data.value.brands.length > 0) {
      hydrateForm(data.value.brands[0].id)
    } else {
      startCreate()
    }
  } catch (error) {
    feedback.value = getErrorMessage(error)
    feedbackTone.value = 'error'
  } finally {
    saving.value = false
  }
}
</script>

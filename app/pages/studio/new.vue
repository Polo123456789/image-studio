<template>
  <div class="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
    <div class="mx-auto max-w-2xl">
      <!-- Back link -->
      <NuxtLink
        to="/studio"
        class="mb-6 inline-flex items-center gap-1.5 text-xs text-text-muted transition hover:text-text"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        Volver a proyectos
      </NuxtLink>

      <header class="mb-12">
        <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Nuevo proyecto</p>
        <h1 class="mt-3 font-display text-3xl text-text">Brief del proyecto</h1>
        <p class="mt-3 text-sm leading-6 text-text-muted">
          Define el objetivo, la audiencia y el contexto. Con esta informacion, Gemini propondra conceptos visuales que despues puedes validar y refinar.
        </p>
      </header>

      <form class="space-y-12" @submit.prevent="submitBrief">
        <StudioFieldSection
          title="Marca"
          hint="Opcional"
          description="Si eliges una marca, su contexto guiara el estudio."
        >
          <AppSelect v-model="form.brand">
            <option value="">Sin marca asociada</option>
            <option v-for="brand in brands" :key="brand" :value="brand">
              {{ brand }}
            </option>
          </AppSelect>
        </StudioFieldSection>

        <StudioFieldSection
          title="Nombre del proyecto"
          description="Se usara para identificar el trabajo y crear la carpeta de imagenes."
        >
          <AppInput
            v-model="form.projectName"
            type="text"
            placeholder="Ej. Lanzamiento verano - bebida energetica"
          />
        </StudioFieldSection>

        <StudioFieldSection
          title="Objetivo principal"
          description="Define una meta clara: vender, captar leads, destacar producto o reforzar marca."
        >
          <AppSelect v-model="form.goal">
            <option value="">Seleccionar objetivo</option>
            <option v-for="goal in goals" :key="goal" :value="goal">
              {{ goal }}
            </option>
          </AppSelect>
        </StudioFieldSection>

        <StudioFieldSection
          title="Que queremos que la audiencia piense o haga"
          description="Define la accion o cambio de percepcion esperado en quien vea el anuncio."
        >
          <AppTextarea
            v-model="form.audienceAction"
            :rows="4"
            placeholder="Ej. Que perciban el producto como la opcion premium mas limpia para su rutina diaria."
          />
        </StudioFieldSection>

        <StudioFieldSection
          title="Mensaje clave"
          description="Claro, util para vender y consistente con el tono visual que generaremos."
        >
          <AppTextarea
            v-model="form.keyMessage"
            :rows="4"
            placeholder="Ej. Energia limpia que se nota, sin sacrificar sabor ni sofisticacion."
          />
        </StudioFieldSection>

        <StudioFieldSection
          title="Medio de difusion"
          description="Selecciona todos los canales donde se usaran estas imagenes."
        >
          <StudioChipMultiSelect v-model="selectedMedia" :options="mediaChannels" />
        </StudioFieldSection>

        <StudioFieldSection
          title="Contexto adicional"
          hint="Opcional"
          description="Detalles del producto, promociones, tono, competidores o cualquier referencia relevante."
        >
          <AppTextarea
            v-model="form.additionalContext"
            :rows="5"
            placeholder="Ej. Producto pensado para oficina, promocion 2x1 durante el primer mes, evitar lenguaje agresivo."
          />
        </StudioFieldSection>

        <div class="grid gap-8 sm:grid-cols-2">
          <StudioStyleGuideSection
            v-model:selected-guide-id="selectedStyleGuideId"
            v-model:notes="form.styleGuideNotes"
            :guides="availableStyleGuides"
            :brand-name="form.brand"
          />

          <StudioAssetSection
            v-model:selected-asset-ids="selectedAssetIds"
            :assets="assets"
            :brands="styleGuideData?.brands ?? []"
            :brand-name="form.brand"
            @assets-uploaded="refreshAssets"
          />
        </div>

        <div class="grid gap-8 sm:grid-cols-3">
          <StudioFieldSection title="Formatos">
            <StudioChipMultiSelect v-model="selectedRatios" :options="aspectRatios" />
          </StudioFieldSection>

          <StudioFieldSection title="Resolucion final">
            <AppSelect v-model="form.resolution">
              <option v-for="resolution in resolutions" :key="resolution" :value="resolution">
                {{ resolution }}
              </option>
            </AppSelect>
          </StudioFieldSection>

          <StudioFieldSection title="Conceptos a proponer">
            <AppSelect v-model="form.conceptCount">
              <option v-for="count in conceptCounts" :key="count" :value="count">
                {{ count }} conceptos
              </option>
            </AppSelect>
          </StudioFieldSection>
        </div>

        <div class="border-t border-border pt-8">
          <p class="text-sm leading-6 text-text-muted">
            {{ summaryText }}
          </p>
          <div class="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p class="max-w-xl text-sm leading-6 text-text-muted">
              {{ isSubmitting
                ? 'Estamos creando el proyecto y generando conceptos iniciales...'
                : `Siguiente paso: Gemini Flash redacta ${form.conceptCount} conceptos. Cada concepto se valida con preview barato antes de pasar a generacion final.` }}
            </p>

            <AppButton type="submit" :disabled="isSubmitting || !canContinue" :aria-busy="isSubmitting">
              {{ isSubmitting ? 'Creando proyecto...' : 'Crear y generar conceptos' }}
            </AppButton>
          </div>

          <div v-if="isSubmitting" class="mt-4 rounded-lg border border-accent/25 bg-accent/8 px-4 py-3">
            <div class="flex items-center gap-3">
              <svg class="h-4 w-4 animate-spin text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              <p class="text-sm text-text-muted">
                Preparando el brief, enviandolo a Gemini y abriendo el workspace.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AssetRecord, AssetsResponse } from '../../../shared/types/assets'
import type { StudioBriefPayload, StudioProjectResponse } from '../../../shared/types/studio'
import type { StyleGuidesResponse } from '../../../shared/types/style-guides'

import AppButton from '~/components/base/AppButton.vue'
import AppInput from '~/components/base/AppInput.vue'
import AppSelect from '~/components/base/AppSelect.vue'
import AppTextarea from '~/components/base/AppTextarea.vue'
import StudioAssetSection from '~/components/studio/StudioAssetSection.vue'
import StudioChipMultiSelect from '~/components/studio/StudioChipMultiSelect.vue'
import StudioFieldSection from '~/components/studio/StudioFieldSection.vue'
import StudioStyleGuideSection from '~/components/studio/StudioStyleGuideSection.vue'
import {
  buildStudioBriefPayload,
  createStudioBriefFormState,
  defaultStudioAspectRatios,
  defaultStudioMediaChannels,
  studioAspectRatios,
  studioConceptCounts,
  studioGoals,
  studioMediaChannels,
  studioResolutions,
  summarizeStudioBrief
} from '~/utils/studio-brief'

const router = useRouter()
const { brief, concepts, isGeneratingConcepts, generationMessage, setProject, clearProject } = useStudioSession()
const { data: styleGuideData } = await useFetch<StyleGuidesResponse>('/api/style-guides')
const { data: assetData, refresh: refreshAssets } = await useFetch<AssetsResponse>('/api/assets')

// Clear any previous project on entering "new"
clearProject()

const goals = studioGoals
const mediaChannels = studioMediaChannels
const aspectRatios = studioAspectRatios
const resolutions = studioResolutions
const conceptCounts = studioConceptCounts

const form = reactive(createStudioBriefFormState())

const selectedMedia = ref<string[]>([...defaultStudioMediaChannels])
const selectedRatios = ref<string[]>([...defaultStudioAspectRatios])
const selectedStyleGuideId = ref<number | null>(null)
const selectedAssetIds = ref<number[]>([])
const isSubmitting = ref(false)

const assets = computed<AssetRecord[]>(() => assetData.value?.assets ?? [])

const availableStyleGuides = computed(() => {
  const guides = styleGuideData.value?.guides ?? []

  return [...guides].sort((left, right) => {
    const leftPriority = left.brandName === form.brand ? 0 : left.brandId === null ? 1 : 2
    const rightPriority = right.brandName === form.brand ? 0 : right.brandId === null ? 1 : 2

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority
    }

    return left.name.localeCompare(right.name, 'es')
  })
})

const canContinue = computed(() => {
  return Boolean(form.projectName.trim() && form.goal && selectedRatios.value.length && selectedMedia.value.length)
})

const summaryText = computed(() => {
  return summarizeStudioBrief(form, selectedMedia.value, selectedRatios.value, selectedStyleGuideId.value, selectedAssetIds.value.length, 'conceptos iniciales')
})

function buildBriefPayload(): StudioBriefPayload {
  return buildStudioBriefPayload(form, selectedMedia.value, selectedRatios.value, selectedStyleGuideId.value, selectedAssetIds.value)
}

async function submitBrief() {
  if (!canContinue.value) return

  isSubmitting.value = true
  const payload = buildBriefPayload()
  brief.value = payload

  try {
    const response = await $fetch<StudioProjectResponse>('/api/studio/projects', {
      method: 'POST',
      body: { brief: payload },
    })

    setProject(response.project)

    if (!response.project.concepts.length) {
      concepts.value = []
      isGeneratingConcepts.value = true
      generationMessage.value = 'Preparando el brief para generar conceptos.'
    }

    await router.push(`/studio/${response.project.slug}/concepts`)
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

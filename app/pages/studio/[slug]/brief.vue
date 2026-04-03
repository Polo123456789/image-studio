<template>
  <div class="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
    <div class="mx-auto max-w-2xl">
      <!-- Breadcrumb -->
      <nav class="mb-6 flex items-center gap-1.5 text-xs text-text-muted">
        <NuxtLink to="/studio" class="transition hover:text-text">Proyectos</NuxtLink>
        <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        <span class="text-text">{{ brief.projectName || 'Proyecto' }}</span>
      </nav>

      <!-- Tabs -->
      <div class="mb-10 flex gap-1 rounded-lg border border-border bg-surface-2/50 p-1">
        <div
          class="flex-1 rounded-md bg-accent/10 px-4 py-2 text-center text-sm font-medium text-text"
        >
          Brief
        </div>
        <NuxtLink
          :to="`/studio/${slug}/concepts`"
          class="flex-1 rounded-md px-4 py-2 text-center text-sm text-text-muted transition hover:bg-surface-2 hover:text-text"
        >
          Conceptos
        </NuxtLink>
      </div>

      <header class="mb-12">
        <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Editar brief</p>
        <h1 class="mt-3 font-display text-3xl text-text">{{ brief.projectName || 'Proyecto sin nombre' }}</h1>
        <p class="mt-3 text-sm leading-6 text-text-muted">
          Modifica el brief y guarda los cambios. Para regenerar conceptos, ve a la pestana de Conceptos.
        </p>
      </header>

      <div v-if="loading" class="rounded-lg border border-border bg-surface px-6 py-8 text-sm text-text-muted">
        Cargando proyecto...
      </div>

      <div v-else-if="loadError" class="rounded-lg border border-danger/40 bg-danger/10 px-6 py-8 text-sm text-danger">
        {{ loadError }}
      </div>

      <form v-else class="space-y-12" @submit.prevent="saveBrief">
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
          ></AppTextarea>
        </StudioFieldSection>

        <StudioFieldSection
          title="Mensaje clave"
          description="Claro, util para vender y consistente con el tono visual que generaremos."
        >
          <AppTextarea
            v-model="form.keyMessage"
            :rows="4"
            placeholder="Ej. Energia limpia que se nota, sin sacrificar sabor ni sofisticacion."
          ></AppTextarea>
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
          ></AppTextarea>
        </StudioFieldSection>

        <div class="grid gap-8 sm:grid-cols-2">
          <StudioPendingPanel
            title="Guia de estilo"
            description="Se conectara cuando implementemos la gestion de guias de estilo."
          />

          <StudioPendingPanel
            title="Assets"
            description="Se conectara cuando implementemos la gestion de assets."
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
            <p v-if="feedback" class="text-sm" :class="feedbackClass">
              {{ feedback }}
            </p>
            <p v-else class="text-sm leading-6 text-text-muted">
              Guarda para actualizar el brief. Los conceptos existentes no cambiaran.
            </p>

            <AppButton type="submit" :disabled="isSaving || !canSave" :aria-busy="isSaving">
              {{ isSaving ? 'Guardando...' : 'Guardar brief' }}
            </AppButton>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StudioBriefPayload, StudioProjectResponse } from '../../../../shared/types/studio'

import AppButton from '~/components/base/AppButton.vue'
import AppInput from '~/components/base/AppInput.vue'
import AppSelect from '~/components/base/AppSelect.vue'
import AppTextarea from '~/components/base/AppTextarea.vue'
import StudioChipMultiSelect from '~/components/studio/StudioChipMultiSelect.vue'
import StudioFieldSection from '~/components/studio/StudioFieldSection.vue'
import StudioPendingPanel from '~/components/studio/StudioPendingPanel.vue'
import {
  applyStudioBriefToForm,
  buildStudioBriefPayload,
  createStudioBriefFormState,
  defaultStudioAspectRatios,
  defaultStudioMediaChannels,
  studioAspectRatios,
  studioBrands,
  studioConceptCounts,
  studioGoals,
  studioMediaChannels,
  studioResolutions,
  summarizeStudioBrief
} from '~/utils/studio-brief'

const route = useRoute()
const { brief, setProject } = useStudioSession()

const slug = typeof route.params.slug === 'string' ? route.params.slug : ''

if (!slug) {
  throw createError({
    statusCode: 400,
    statusMessage: 'Project slug is required'
  })
}

const loading = ref(true)
const loadError = ref('')
const isSaving = ref(false)
const feedback = ref('')
const feedbackTone = ref<'success' | 'error'>('success')

const brands = studioBrands
const goals = studioGoals
const mediaChannels = studioMediaChannels
const aspectRatios = studioAspectRatios
const resolutions = studioResolutions
const conceptCounts = studioConceptCounts

const form = reactive(createStudioBriefFormState())

const selectedMedia = ref<string[]>([...defaultStudioMediaChannels])
const selectedRatios = ref<string[]>([...defaultStudioAspectRatios])

// Load project data
try {
  const response = await $fetch<StudioProjectResponse>(`/api/studio/projects/${slug}`)
  setProject(response.project)

  const nextSelection = applyStudioBriefToForm(form, response.project.brief)
  selectedMedia.value = nextSelection.selectedMedia
  selectedRatios.value = nextSelection.selectedRatios
}
catch {
  loadError.value = 'No se pudo cargar el proyecto. Verifica que el slug sea correcto.'
}
finally {
  loading.value = false
}

const canSave = computed(() => {
  return Boolean(form.projectName.trim() && form.goal && selectedRatios.value.length && selectedMedia.value.length)
})

const summaryText = computed(() => {
  return summarizeStudioBrief(form, selectedMedia.value, selectedRatios.value)
})

const feedbackClass = computed(() => feedbackTone.value === 'success' ? 'text-accent' : 'text-danger')

function buildBriefPayload(): StudioBriefPayload {
  return buildStudioBriefPayload(form, selectedMedia.value, selectedRatios.value)
}

async function saveBrief() {
  if (!canSave.value) return

  isSaving.value = true
  feedback.value = ''

  try {
    const payload = buildBriefPayload()
    const response = await $fetch<StudioProjectResponse>(`/api/studio/projects/${slug}/brief`, {
      method: 'PUT',
      body: { brief: payload },
    })

    setProject(response.project)
    feedback.value = 'Brief guardado correctamente.'
    feedbackTone.value = 'success'
  }
  catch {
    feedback.value = 'No se pudo guardar el brief. Intentalo de nuevo.'
    feedbackTone.value = 'error'
  }
  finally {
    isSaving.value = false
  }
}
</script>

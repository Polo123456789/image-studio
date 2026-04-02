<template>
  <div class="min-h-screen bg-bg text-text">
    <NuxtRouteAnnouncer />

    <div class="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
      <aside class="hidden w-64 shrink-0 border-r border-border bg-surface px-6 py-10 lg:flex lg:flex-col">
        <div>
          <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
            Image Studio
          </p>
          <h1 class="mt-5 font-display text-2xl leading-snug text-text">
            Brief publicitario
          </h1>
          <p class="mt-4 text-sm leading-6 text-text-muted">
            Define el marco creativo antes de pedir conceptos. Luego evaluas previews baratos y apruebas solo lo que merezca pasar a HD.
          </p>
        </div>

        <nav class="mt-10 space-y-1">
          <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
            Flujo
          </p>
          <ul class="mt-3 space-y-2 text-sm text-text-muted">
            <li>1. Brief y reglas</li>
            <li>2. Conceptos con preview Imagen 4</li>
            <li>3. Aprobacion y generacion final HD</li>
          </ul>

          <div class="mt-6">
            <NuxtLink class="text-sm text-text-muted transition hover:text-text" to="/settings">
              Configuracion de Gemini
            </NuxtLink>
          </div>
        </nav>

        <div class="mt-10 rounded border border-border bg-surface-2 p-4 text-sm text-text-muted">
          <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
            Nota
          </p>
          <p class="mt-2 leading-6">
            El preview es rapido y barato. La generacion final usa el modelo de mayor calidad solo cuando el concepto ya esta validado.
          </p>
        </div>

        <div class="mt-auto pt-10">
          <button
            class="text-sm text-text-muted transition hover:text-text"
            @click="toggleTheme"
          >
            Cambiar tema
          </button>
        </div>
      </aside>

      <main class="flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-14 lg:py-14">
        <div class="mx-auto max-w-2xl">
          <header class="mb-12">
            <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Estudio</p>
            <h2 class="mt-3 font-display text-3xl text-text">
              Brief para imagenes publicitarias
            </h2>
            <p class="mt-3 text-sm leading-6 text-text-muted">
              Este paso define la informacion base que Gemini Flash usara para proponer conceptos distintos antes de generar imagenes finales.
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
               <p class="max-w-xl text-sm leading-6 text-text-muted">
                  {{ isSubmitting
                    ? 'Estamos generando conceptos iniciales. Te llevamos al workspace y ahi veras el progreso.'
                    : `Siguiente paso: Gemini Flash redacta ${form.conceptCount} conceptos. Cada concepto se valida con preview barato antes de pasar a generacion final.` }}
                </p>

                <AppButton type="submit" :disabled="isSubmitting || !canContinue" :aria-busy="isSubmitting">
                  {{ isSubmitting ? 'Generando conceptos...' : 'Continuar a conceptos' }}
                </AppButton>
              </div>

              <div v-if="isSubmitting" class="mt-4 rounded-lg border border-accent/25 bg-accent/8 px-4 py-3">
                <div class="flex items-center gap-3">
                  <svg class="h-4 w-4 animate-spin text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  <p class="text-sm text-text-muted">
                    Estamos preparando el brief, enviandolo a Gemini y abriendo el workspace.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StudioProjectResponse } from '../../../shared/types/studio'

import AppButton from '~/components/base/AppButton.vue'
import AppInput from '~/components/base/AppInput.vue'
import AppSelect from '~/components/base/AppSelect.vue'
import AppTextarea from '~/components/base/AppTextarea.vue'
import StudioChipMultiSelect from '~/components/studio/StudioChipMultiSelect.vue'
import StudioFieldSection from '~/components/studio/StudioFieldSection.vue'
import StudioPendingPanel from '~/components/studio/StudioPendingPanel.vue'

const route = useRoute()
const router = useRouter()
const { projectSlug, brief, concepts, isGeneratingConcepts, generationMessage, setProject } = useStudioSession()

const brands = ['Aster Labs', 'Casa Nativa', 'North Bloom']

const goals = [
  'Aumentar ventas',
  'Generar leads',
  'Lanzar un producto',
  'Mejorar reconocimiento de marca',
  'Promocionar una oferta',
]

const mediaChannels = [
  'Google Ads',
  'Instagram Feed',
  'Instagram Stories',
  'Facebook Ads',
  'TikTok',
  'LinkedIn Ads',
  'Display Banners',
  'Email',
]

const aspectRatios = ['1:1', '4:5', '3:4', '16:9', '9:16', '21:9']
const resolutions = ['1K rapido', '2K estandar', '4K alta calidad']
const conceptCounts = [2, 3, 4, 6]

const form = reactive({
  brand: brief.value.brand,
  projectName: brief.value.projectName,
  goal: brief.value.goal,
  audienceAction: brief.value.audienceAction,
  keyMessage: brief.value.keyMessage,
  additionalContext: brief.value.additionalContext,
  resolution: brief.value.resolution,
  conceptCount: brief.value.conceptCount,
})

const selectedMedia = ref<string[]>([...brief.value.mediaChannels])
const selectedRatios = ref<string[]>([...brief.value.aspectRatios])
const isSubmitting = ref(false)
const routeProjectSlug = computed(() => typeof route.params.slug === 'string' ? route.params.slug : '')

const canContinue = computed(() => {
  return Boolean(form.projectName.trim() && form.goal && selectedRatios.value.length && selectedMedia.value.length)
})

const summaryText = computed(() => {
  const project = form.projectName || 'Proyecto sin nombre'
  const channels = selectedMedia.value.length ? selectedMedia.value.join(', ') : 'sin medios'
  const ratios = selectedRatios.value.length ? selectedRatios.value.join(', ') : 'sin formatos'

  return `${project} — ${form.goal.toLowerCase()} — ${channels} — ${ratios} — ${form.conceptCount} conceptos iniciales.`
})

watch(brief, (nextBrief) => {
  form.brand = nextBrief.brand
  form.projectName = nextBrief.projectName
  form.goal = nextBrief.goal
  form.audienceAction = nextBrief.audienceAction
  form.keyMessage = nextBrief.keyMessage
  form.additionalContext = nextBrief.additionalContext
  form.resolution = nextBrief.resolution
  form.conceptCount = nextBrief.conceptCount
  selectedMedia.value = [...nextBrief.mediaChannels]
  selectedRatios.value = [...nextBrief.aspectRatios]
}, { immediate: true, deep: true })

function persistBrief() {
  brief.value = {
    brand: form.brand,
    projectName: form.projectName,
    goal: form.goal,
    audienceAction: form.audienceAction,
    keyMessage: form.keyMessage,
    additionalContext: form.additionalContext,
    resolution: form.resolution,
    conceptCount: Number(form.conceptCount),
    mediaChannels: [...selectedMedia.value],
    aspectRatios: [...selectedRatios.value]
  }
}

async function submitBrief() {
  if (!canContinue.value) {
    return
  }

  isSubmitting.value = true
  persistBrief()

  try {
    let response: StudioProjectResponse

    if (routeProjectSlug.value) {
      response = await $fetch<StudioProjectResponse>(`/api/studio/projects/${routeProjectSlug.value}/brief`, {
        method: 'PUT',
        body: {
          brief: brief.value
        }
      })
    }
    else {
      response = await $fetch<StudioProjectResponse>('/api/studio/projects', {
        method: 'POST',
        body: {
          brief: brief.value
        }
      })
    }

    setProject(response.project)

    if (!response.project.concepts.length) {
      concepts.value = []
      isGeneratingConcepts.value = true
      generationMessage.value = 'Preparando el brief para generar conceptos.'
    }
    else {
      isGeneratingConcepts.value = false
      generationMessage.value = ''
    }

    await router.push(`/studio/${response.project.slug}/concepts`)
  }
  finally {
    isSubmitting.value = false
  }
}

function toggleTheme() {
  document.documentElement.classList.toggle('light')
}
</script>

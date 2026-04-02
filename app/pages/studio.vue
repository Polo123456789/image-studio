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
            Define el contexto antes de generar. Cuanto mas preciso, mejor el resultado.
          </p>
        </div>

        <nav class="mt-10 space-y-1">
          <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
            Secciones
          </p>
          <ul class="mt-3 space-y-0.5 text-sm text-text-muted">
            <li class="py-1">Marca</li>
            <li class="py-1">Proyecto</li>
            <li class="py-1">Objetivo</li>
            <li class="py-1">Mensaje</li>
            <li class="py-1">Medios y formatos</li>
            <li class="py-1 text-text-muted/40">Guia de estilo <span class="font-mono text-[10px]">—</span></li>
            <li class="py-1 text-text-muted/40">Assets <span class="font-mono text-[10px]">—</span></li>
          </ul>
        </nav>

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
              Definimos el contexto, el mensaje y los medios. La IA generara varias imagenes dentro de esas reglas.
            </p>
          </header>

          <form class="space-y-12">
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
                placeholder="Ej. Lanzamiento verano — bebida energetica"
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
                :rows="3"
                placeholder="Ej. Que perciban el producto como la opcion premium mas limpia para su rutina diaria."
              />
            </StudioFieldSection>

            <StudioFieldSection
              title="Mensaje clave"
              description="Claro, util para vender y consistente con el tono visual que generaremos."
            >
              <AppTextarea
                v-model="form.keyMessage"
                :rows="3"
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
                :rows="4"
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

              <StudioFieldSection title="Resolucion">
                <AppSelect v-model="form.resolution">
                  <option v-for="resolution in resolutions" :key="resolution" :value="resolution">
                    {{ resolution }}
                  </option>
                </AppSelect>
              </StudioFieldSection>

              <StudioFieldSection title="Cantidad">
                <AppSelect v-model="form.imageCount">
                  <option v-for="count in imageCounts" :key="count" :value="count">
                    {{ count }} imagenes
                  </option>
                </AppSelect>
              </StudioFieldSection>
            </div>

            <div class="border-t border-border pt-8">
              <p class="text-sm leading-6 text-text-muted">
                {{ summaryText }}
              </p>
              <div class="mt-6">
                <AppButton type="button">
                  Continuar al marco creativo
                </AppButton>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppButton from '~/components/base/AppButton.vue'
import AppInput from '~/components/base/AppInput.vue'
import AppSelect from '~/components/base/AppSelect.vue'
import AppTextarea from '~/components/base/AppTextarea.vue'
import StudioChipMultiSelect from '~/components/studio/StudioChipMultiSelect.vue'
import StudioFieldSection from '~/components/studio/StudioFieldSection.vue'
import StudioPendingPanel from '~/components/studio/StudioPendingPanel.vue'

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
const imageCounts = [2, 4, 6, 8, 12]

const form = reactive({
  brand: '',
  projectName: '',
  goal: 'Aumentar ventas',
  audienceAction: '',
  keyMessage: '',
  additionalContext: '',
  resolution: '1K rapido',
  imageCount: 4,
})

const selectedMedia = ref<string[]>(['Google Ads', 'Instagram Stories'])
const selectedRatios = ref<string[]>(['1:1', '9:16'])

const summaryText = computed(() => {
  const project = form.projectName || 'Proyecto sin nombre'
  const channels = selectedMedia.value.length ? selectedMedia.value.join(', ') : 'sin medios'
  const ratios = selectedRatios.value.length ? selectedRatios.value.join(', ') : 'sin formatos'

  return `${project} — ${form.goal.toLowerCase()} — ${channels} — ${ratios} — ${form.imageCount} imagenes.`
})

function toggleTheme() {
  document.documentElement.classList.toggle('light')
}
</script>

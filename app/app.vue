<template>
  <div class="min-h-screen bg-bg text-text">
    <NuxtRouteAnnouncer />

    <div class="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
      <aside class="hidden w-72 shrink-0 border-r border-border/80 bg-surface/55 px-6 py-8 lg:flex lg:flex-col">
        <div>
          <p class="font-mono text-xs uppercase tracking-[0.28em] text-accent">
            Image Studio
          </p>
          <h1 class="mt-4 max-w-[12rem] font-display text-3xl leading-tight text-text">
            Recoleccion de informacion
          </h1>
          <p class="mt-4 text-sm leading-7 text-text-muted">
            Primer paso del estudio para construir anuncios visuales con un marco claro antes de generar.
          </p>
        </div>

        <div class="mt-10 space-y-3 rounded-xl border border-border/80 bg-bg/55 p-4 shadow-sm">
          <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
            En esta version
          </p>
          <ul class="space-y-2 text-sm leading-6 text-text-muted">
            <li>Marca opcional al inicio</li>
            <li>Brief orientado a anuncios</li>
            <li>Multiselect de medios</li>
            <li>Guias y assets pendientes</li>
          </ul>
        </div>

        <div class="mt-auto flex items-center gap-3 pt-10">
          <button
            class="rounded-full border border-border bg-surface-2 px-4 py-2 text-sm text-text transition hover:border-accent hover:text-accent"
            @click="toggleTheme"
          >
            Cambiar tema
          </button>
        </div>
      </aside>

      <main class="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-10">
        <div class="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-border/80 bg-surface shadow-lg">
          <div class="border-b border-border/80 px-5 py-4 sm:px-8 sm:py-6">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="font-mono text-[11px] uppercase tracking-[0.28em] text-accent">
                  Estudio
                </p>
                <h2 class="mt-3 font-display text-2xl text-text sm:text-3xl">
                  Brief para imagenes publicitarias
                </h2>
                <p class="mt-3 max-w-2xl text-sm leading-7 text-text-muted sm:text-base">
                  Definimos el contexto de la campana, el mensaje y los medios donde vivira la creatividad.
                  Luego la IA generara varias imagenes distintas dentro de esas reglas.
                </p>
              </div>

              <div class="flex items-center gap-3 self-start rounded-full border border-accent/30 bg-accent-glow px-4 py-2">
                <span class="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
                  Modo interactivo
                </span>
              </div>
            </div>
          </div>

          <div class="px-5 py-6 sm:px-8 sm:py-8">
            <form class="space-y-10">
              <section class="space-y-4">
                <div class="flex items-center gap-3">
                  <span class="font-mono text-xs text-accent">0.</span>
                  <h3 class="font-body text-xl font-medium text-text">
                    Marca
                  </h3>
                  <span class="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    Opcional
                  </span>
                </div>

                <p class="max-w-3xl text-sm leading-7 text-text-muted">
                  Si eliges una marca, su contexto guiara el resto del estudio. Mas adelante conectaremos
                  automaticamente su guia de estilo y sus assets.
                </p>

                <label class="block">
                  <span class="sr-only">Seleccionar marca</span>
                  <select
                    v-model="form.brand"
                    class="w-full rounded-xl border border-border bg-bg px-4 py-4 text-base text-text outline-none transition placeholder:text-text-muted focus:border-accent"
                  >
                    <option value="">Sin marca asociada</option>
                    <option v-for="brand in brands" :key="brand" :value="brand">
                      {{ brand }}
                    </option>
                  </select>
                </label>
              </section>

              <section class="space-y-4">
                <div class="flex items-center gap-3">
                  <span class="font-mono text-xs text-accent">1.</span>
                  <h3 class="font-body text-xl font-medium text-text">
                    Nombre del proyecto
                  </h3>
                </div>

                <p class="max-w-3xl text-sm leading-7 text-text-muted">
                  Este nombre se usara para identificar el trabajo y tambien para crear la carpeta donde se guardaran las imagenes generadas.
                </p>

                <input
                  v-model="form.projectName"
                  type="text"
                  placeholder="Ej. Lanzamiento verano - bebida energetica"
                  class="w-full rounded-xl border border-border bg-bg px-4 py-4 text-base text-text outline-none transition placeholder:text-text-muted focus:border-accent"
                >
              </section>

              <section class="space-y-4">
                <div class="flex items-center gap-3">
                  <span class="font-mono text-xs text-accent">2.</span>
                  <h3 class="font-body text-xl font-medium text-text">
                    Objetivo principal de la campana
                  </h3>
                </div>

                <p class="max-w-3xl text-sm leading-7 text-text-muted">
                  Define una meta clara: vender, captar leads, destacar producto o reforzar recordacion de marca.
                </p>

                <label class="block">
                  <span class="sr-only">Objetivo principal</span>
                  <select
                    v-model="form.goal"
                    class="w-full rounded-xl border border-border bg-bg px-4 py-4 text-base text-text outline-none transition placeholder:text-text-muted focus:border-accent"
                  >
                    <option value="">Seleccionar objetivo</option>
                    <option v-for="goal in goals" :key="goal" :value="goal">
                      {{ goal }}
                    </option>
                  </select>
                </label>
              </section>

              <section class="space-y-4">
                <div class="flex items-center gap-3">
                  <span class="font-mono text-xs text-accent">3.</span>
                  <h3 class="font-body text-xl font-medium text-text">
                    Que queremos que la audiencia piense o haga
                  </h3>
                </div>

                <p class="max-w-3xl text-sm leading-7 text-text-muted">
                  Define la accion o cambio de percepcion esperado en quien vea el anuncio.
                </p>

                <textarea
                  v-model="form.audienceAction"
                  rows="4"
                  placeholder="Ej. Que perciban el producto como la opcion premium mas limpia para su rutina diaria."
                  class="w-full rounded-xl border border-border bg-bg px-4 py-4 text-base text-text outline-none transition placeholder:text-text-muted focus:border-accent"
                />
              </section>

              <section class="space-y-4">
                <div class="flex items-center gap-3">
                  <span class="font-mono text-xs text-accent">4.</span>
                  <h3 class="font-body text-xl font-medium text-text">
                    Mensaje clave
                  </h3>
                </div>

                <p class="max-w-3xl text-sm leading-7 text-text-muted">
                  Debe ser claro, util para vender y consistente con el tono visual que luego generaremos.
                </p>

                <textarea
                  v-model="form.keyMessage"
                  rows="4"
                  placeholder="Ej. Energia limpia que se nota, sin sacrificar sabor ni sofisticacion."
                  class="w-full rounded-xl border border-border bg-bg px-4 py-4 text-base text-text outline-none transition placeholder:text-text-muted focus:border-accent"
                />
              </section>

              <section class="space-y-4">
                <div class="flex items-center gap-3">
                  <span class="font-mono text-xs text-accent">5.</span>
                  <h3 class="font-body text-xl font-medium text-text">
                    Medio de difusion
                  </h3>
                </div>

                <p class="max-w-3xl text-sm leading-7 text-text-muted">
                  Selecciona todos los canales donde se usaran estas imagenes. El framing de una pieza para Google Ads no es el mismo que para una historia de Instagram.
                </p>

                <div class="flex flex-wrap gap-3">
                  <button
                    v-for="channel in mediaChannels"
                    :key="channel"
                    type="button"
                    class="rounded-full border px-4 py-2 text-sm transition"
                    :class="selectedMedia.includes(channel)
                      ? 'border-accent bg-accent text-bg shadow-sm'
                      : 'border-border bg-bg text-text-muted hover:border-accent/60 hover:text-text'"
                    @click="toggleMedia(channel)"
                  >
                    {{ channel }}
                  </button>
                </div>
              </section>

              <section class="space-y-4">
                <div class="flex items-center gap-3">
                  <span class="font-mono text-xs text-accent">6.</span>
                  <h3 class="font-body text-xl font-medium text-text">
                    Contexto adicional
                  </h3>
                  <span class="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    Opcional
                  </span>
                </div>

                <p class="max-w-3xl text-sm leading-7 text-text-muted">
                  Puedes agregar detalles del producto, promociones, tono de marca, competidores o cualquier referencia textual relevante.
                </p>

                <textarea
                  v-model="form.additionalContext"
                  rows="5"
                  placeholder="Ej. Producto pensado para oficina, promocion 2x1 durante el primer mes, evitar lenguaje agresivo o fitness extremo."
                  class="w-full rounded-xl border border-border bg-bg px-4 py-4 text-base text-text outline-none transition placeholder:text-text-muted focus:border-accent"
                />
              </section>

              <section class="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <div class="space-y-4 rounded-2xl border border-dashed border-border bg-bg/65 p-5">
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                      <span class="font-mono text-xs text-accent">7.</span>
                      <h3 class="font-body text-xl font-medium text-text">
                        Guia de estilo
                      </h3>
                    </div>
                    <span class="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                      Pendiente
                    </span>
                  </div>

                  <p class="text-sm leading-7 text-text-muted">
                    Este campo quedara conectado cuando implementemos la gestion de guias de estilo.
                  </p>

                  <div class="rounded-xl border border-border bg-surface px-4 py-5 text-sm text-text-muted">
                    Selector de guia de estilo no disponible todavia.
                  </div>
                </div>

                <div class="space-y-4 rounded-2xl border border-dashed border-border bg-bg/65 p-5">
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                      <span class="font-mono text-xs text-accent">8.</span>
                      <h3 class="font-body text-xl font-medium text-text">
                        Assets
                      </h3>
                    </div>
                    <span class="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                      Pendiente
                    </span>
                  </div>

                  <p class="text-sm leading-7 text-text-muted">
                    Se conectara cuando implementemos la gestion de assets y su buscador.
                  </p>

                  <div class="rounded-xl border border-border bg-surface px-4 py-5 text-sm text-text-muted">
                    Cargador y selector de assets no disponible todavia.
                  </div>
                </div>
              </section>

              <section class="grid gap-6 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
                <div class="space-y-4">
                  <div class="flex items-center gap-3">
                    <span class="font-mono text-xs text-accent">9.</span>
                    <h3 class="font-body text-xl font-medium text-text">
                      Formatos
                    </h3>
                  </div>

                  <div class="flex flex-wrap gap-3">
                    <button
                      v-for="ratio in aspectRatios"
                      :key="ratio"
                      type="button"
                      class="rounded-xl border px-4 py-3 text-sm transition"
                      :class="selectedRatios.includes(ratio)
                        ? 'border-accent bg-accent text-bg shadow-sm'
                        : 'border-border bg-bg text-text-muted hover:border-accent/60 hover:text-text'"
                      @click="toggleRatio(ratio)"
                    >
                      {{ ratio }}
                    </button>
                  </div>
                </div>

                <div class="space-y-4">
                  <div class="flex items-center gap-3">
                    <span class="font-mono text-xs text-accent">10.</span>
                    <h3 class="font-body text-xl font-medium text-text">
                      Resolucion
                    </h3>
                  </div>

                  <select
                    v-model="form.resolution"
                    class="w-full rounded-xl border border-border bg-bg px-4 py-4 text-base text-text outline-none transition focus:border-accent"
                  >
                    <option v-for="resolution in resolutions" :key="resolution" :value="resolution">
                      {{ resolution }}
                    </option>
                  </select>
                </div>

                <div class="space-y-4">
                  <div class="flex items-center gap-3">
                    <span class="font-mono text-xs text-accent">11.</span>
                    <h3 class="font-body text-xl font-medium text-text">
                      Cantidad de imagenes
                    </h3>
                  </div>

                  <select
                    v-model="form.imageCount"
                    class="w-full rounded-xl border border-border bg-bg px-4 py-4 text-base text-text outline-none transition focus:border-accent"
                  >
                    <option v-for="count in imageCounts" :key="count" :value="count">
                      {{ count }}
                    </option>
                  </select>
                </div>
              </section>

              <section class="rounded-2xl border border-border/80 bg-bg/55 p-5 sm:p-6">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                      Resumen rapido
                    </p>
                    <p class="mt-3 text-sm leading-7 text-text-muted">
                      {{ summaryText }}
                    </p>
                  </div>

                  <button
                    type="button"
                    class="rounded-2xl bg-accent px-6 py-4 text-sm font-medium text-bg transition hover:opacity-90"
                  >
                    Continuar al marco creativo
                  </button>
                </div>
              </section>
            </form>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  const channels = selectedMedia.value.length ? selectedMedia.value.join(', ') : 'sin medios seleccionados'
  const ratios = selectedRatios.value.length ? selectedRatios.value.join(', ') : 'sin formatos seleccionados'

  return `${project}. Objetivo: ${form.goal.toLowerCase()}. Medios: ${channels}. Formatos: ${ratios}. ${form.imageCount} imagenes por ronda.`
})

function toggleTheme() {
  document.documentElement.classList.toggle('light')
}

function toggleMedia(channel: string) {
  if (selectedMedia.value.includes(channel)) {
    selectedMedia.value = selectedMedia.value.filter((item) => item !== channel)
    return
  }

  selectedMedia.value = [...selectedMedia.value, channel]
}

function toggleRatio(ratio: string) {
  if (selectedRatios.value.includes(ratio)) {
    selectedRatios.value = selectedRatios.value.filter((item) => item !== ratio)
    return
  }

  selectedRatios.value = [...selectedRatios.value, ratio]
}
</script>

<template>
  <div class="min-h-screen bg-bg text-text">
    <NuxtRouteAnnouncer />

    <div class="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
      <aside class="border-b border-border bg-surface px-5 py-6 lg:w-[320px] lg:shrink-0 lg:border-b-0 lg:border-r lg:px-6 lg:py-8">
        <div>
          <p class="font-mono text-[10px] uppercase tracking-[0.32em] text-accent">Image Studio</p>
          <h1 class="mt-4 font-display text-2xl leading-tight text-text">Mesa de proyectos</h1>
          <p class="mt-3 text-sm leading-6 text-text-muted">
            Cambia entre briefs activos, revisa conceptos persistidos o abre un proyecto nuevo sin perder contexto.
          </p>
        </div>

        <div class="mt-6 rounded-xl border border-border bg-bg/60 p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-mono text-[10px] uppercase tracking-[0.24em] text-text-muted">Proyecto actual</p>
              <p class="mt-2 text-sm font-medium text-text">
                {{ activeProject?.projectName || 'Nuevo proyecto' }}
              </p>
            </div>

            <button
              type="button"
              class="rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-[11px] font-medium text-accent transition hover:border-accent hover:bg-accent/15"
              @click="createProject"
            >
              Nuevo
            </button>
          </div>

          <div v-if="activeProject" class="mt-4 flex flex-wrap gap-2 text-[11px] text-text-muted">
            <span class="rounded-full border border-border px-2.5 py-1">{{ activeProject.goal }}</span>
            <span class="rounded-full border border-border px-2.5 py-1">{{ activeProject.conceptCount }} conceptos</span>
            <span
              class="rounded-full border px-2.5 py-1"
              :class="activeProject.hasApprovedConcepts ? 'border-accent/30 text-accent' : 'border-border text-text-muted'"
            >
              {{ activeProject.hasApprovedConcepts ? 'Con finales' : 'En exploracion' }}
            </span>
          </div>
        </div>

        <nav class="mt-6 grid gap-2">
          <NuxtLink
            class="rounded-lg border px-4 py-3 text-sm transition"
            :class="section === 'brief' ? 'border-accent bg-accent/8 text-text' : 'border-border text-text-muted hover:border-accent/30 hover:text-text'"
            :to="activeProject ? `/studio/${activeProject.slug}/brief` : '/studio'"
          >
            Brief
          </NuxtLink>
          <NuxtLink
            class="rounded-lg border px-4 py-3 text-sm transition"
            :class="section === 'concepts' ? 'border-accent bg-accent/8 text-text' : 'border-border text-text-muted hover:border-accent/30 hover:text-text'"
            :to="activeProject ? `/studio/${activeProject.slug}/concepts` : '/studio'"
          >
            Conceptos
          </NuxtLink>
          <NuxtLink
            class="rounded-lg border border-border px-4 py-3 text-sm text-text-muted transition hover:border-accent/30 hover:text-text"
            to="/settings"
          >
            Configuracion de Gemini
          </NuxtLink>
        </nav>

        <section class="mt-8">
          <div class="flex items-center justify-between gap-3">
            <p class="font-mono text-[10px] uppercase tracking-[0.24em] text-text-muted">Proyectos recientes</p>
            <button
              type="button"
              class="text-xs text-text-muted transition hover:text-text"
              @click="refreshProjects"
            >
              Actualizar
            </button>
          </div>

          <div class="mt-4 space-y-2">
            <NuxtLink
              v-for="project in projects"
              :key="project.slug"
              class="block rounded-xl border px-4 py-3 transition"
              :class="project.slug === activeSlug ? 'border-accent bg-accent/8' : 'border-border bg-surface-2/50 hover:border-accent/30'"
              :to="project.conceptCount ? `/studio/${project.slug}/concepts` : `/studio/${project.slug}/brief`"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-medium text-text">{{ project.projectName }}</p>
                  <p class="mt-1 text-xs leading-5 text-text-muted">{{ project.goal }}</p>
                </div>
                <span class="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                  {{ formatTimestamp(project.updatedAt) }}
                </span>
              </div>

              <div class="mt-3 flex flex-wrap gap-2 text-[11px] text-text-muted">
                <span class="rounded-full border border-border px-2.5 py-1">{{ project.conceptCount }} conceptos</span>
                <span
                  class="rounded-full border px-2.5 py-1"
                  :class="project.hasApprovedConcepts ? 'border-accent/30 text-accent' : 'border-border text-text-muted'"
                >
                  {{ project.hasApprovedConcepts ? 'Con finales' : 'Preview' }}
                </span>
              </div>
            </NuxtLink>

            <div v-if="!projects.length" class="rounded-xl border border-dashed border-border px-4 py-6 text-sm leading-6 text-text-muted">
              Aun no hay proyectos guardados. Crea uno nuevo desde el brief para empezar.
            </div>
          </div>
        </section>

        <div class="mt-8 rounded-xl border border-border bg-surface-2/70 p-4 text-sm text-text-muted">
          <p class="font-mono text-[10px] uppercase tracking-[0.24em] text-accent">Modo de trabajo</p>
          <p class="mt-2 leading-6">
            Valida ideas con preview barato y conserva el historial del proyecto antes de mandar a final HD.
          </p>
          <button
            type="button"
            class="mt-4 text-sm text-text-muted transition hover:text-text"
            @click="toggleTheme"
          >
            Cambiar tema
          </button>
        </div>
      </aside>

      <main class="flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StudioProjectListItem, StudioProjectListResponse } from '../../../shared/types/studio'

const props = defineProps<{
  section: 'brief' | 'concepts'
}>()

const route = useRoute()
const { clearProject, projectSlug } = useStudioSession()

const projects = ref<StudioProjectListItem[]>([])
const activeSlug = computed(() => typeof route.params.slug === 'string' ? route.params.slug : projectSlug.value)
const activeProject = computed(() => projects.value.find((project) => project.slug === activeSlug.value) || null)

await refreshProjects()

watch(() => route.fullPath, (nextPath, previousPath) => {
  if (nextPath !== previousPath) {
    void refreshProjects()
  }
})

async function refreshProjects() {
  const response = await $fetch<StudioProjectListResponse>('/api/studio/projects')

  projects.value = response.projects
}

async function createProject() {
  clearProject()
  await navigateTo('/studio')
}

function toggleTheme() {
  document.documentElement.classList.toggle('light')
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short'
  }).format(new Date(value))
}
</script>

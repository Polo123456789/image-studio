<template>
  <div class="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
    <div class="mx-auto max-w-5xl">
      <!-- Header -->
      <header class="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Estudio</p>
          <h1 class="mt-3 font-display text-3xl text-text">Proyectos</h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-text-muted">
            Cada proyecto agrupa un brief, conceptos generados y sus versiones finales. Crea uno nuevo o retoma donde dejaste.
          </p>
        </div>

        <NuxtLink
          to="/studio/new"
          class="inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-90"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nuevo proyecto
        </NuxtLink>
      </header>

      <!-- Loading -->
      <div v-if="loadingProjects" class="rounded-xl border border-border bg-surface px-6 py-10 text-center text-sm text-text-muted">
        Cargando proyectos...
      </div>

      <!-- Empty state -->
      <div v-else-if="!projects.length" class="rounded-xl border border-dashed border-border bg-surface px-8 py-16 text-center">
        <div class="mx-auto max-w-sm">
          <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2">
            <svg class="h-6 w-6 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
          </div>
          <h2 class="font-display text-xl text-text">Sin proyectos todavia</h2>
          <p class="mt-3 text-sm leading-6 text-text-muted">
            Crea tu primer proyecto para empezar a generar conceptos e imagenes con Gemini.
          </p>
          <NuxtLink
            to="/studio/new"
            class="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-90"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Crear primer proyecto
          </NuxtLink>
        </div>
      </div>

      <!-- Project cards grid -->
      <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <NuxtLink
          v-for="project in projects"
          :key="project.slug"
          class="group rounded-xl border border-border bg-surface transition hover:border-accent/40 hover:shadow-md"
          :to="projectLink(project)"
        >
          <div class="px-5 pt-5 pb-4">
            <div class="flex items-start justify-between gap-3">
              <h3 class="text-sm font-medium text-text group-hover:text-accent transition">
                {{ project.projectName }}
              </h3>
              <span class="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                {{ formatDate(project.updatedAt) }}
              </span>
            </div>

            <p class="mt-2 text-xs leading-5 text-text-muted line-clamp-1">
              {{ project.goal }}
            </p>
          </div>

          <div class="flex items-center gap-2 border-t border-border px-5 py-3">
            <span
              class="rounded-full border px-2.5 py-1 text-[11px]"
              :class="project.hasApprovedConcepts
                ? 'border-accent/30 bg-accent/8 text-accent'
                : project.conceptCount
                  ? 'border-[#7a5b22]/40 bg-[#2a2118]/60 text-[#ffcc73]'
                  : 'border-border text-text-muted'"
            >
              {{ projectStatusLabel(project) }}
            </span>
            <span v-if="project.conceptCount" class="text-[11px] text-text-muted">
              {{ project.conceptCount }} {{ project.conceptCount === 1 ? 'concepto' : 'conceptos' }}
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StudioProjectListItem, StudioProjectListResponse } from '../../../shared/types/studio'

const projects = ref<StudioProjectListItem[]>([])
const loadingProjects = ref(true)

onMounted(async () => {
  await loadProjects()
})

// Also reload when navigating back to this page
const route = useRoute()
watch(() => route.fullPath, async (newPath) => {
  if (newPath === '/studio') {
    await loadProjects()
  }
})

async function loadProjects() {
  loadingProjects.value = true
  try {
    const response = await $fetch<StudioProjectListResponse>('/api/studio/projects')
    projects.value = response.projects
  }
  finally {
    loadingProjects.value = false
  }
}

function projectLink(project: StudioProjectListItem): string {
  if (project.conceptCount) {
    return `/studio/${project.slug}/concepts`
  }
  return `/studio/${project.slug}/brief`
}

function projectStatusLabel(project: StudioProjectListItem): string {
  if (project.hasApprovedConcepts) return 'Con finales'
  if (project.conceptCount) return 'En exploracion'
  return 'Solo brief'
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}
</script>

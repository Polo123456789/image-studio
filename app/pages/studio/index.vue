<template>
  <div class="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
    <div class="mx-auto max-w-5xl">
      <!-- Header -->
      <header class="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Estudio</p>
          <h1 class="mt-3 font-display text-3xl text-text">Proyectos</h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-text-muted">
            Cada proyecto agrupa un brief, conceptos y artes generados. Crea uno nuevo o retoma donde dejaste.
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
      <template v-else>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <NuxtLink
            v-for="project in projects"
            :key="project.slug"
            class="group overflow-hidden rounded-xl border border-border bg-surface transition hover:border-accent/40 hover:shadow-md"
            :to="projectLink(project)"
          >
            <div class="relative aspect-[4/3] overflow-hidden bg-surface-2">
              <img
                v-if="project.thumbnailUrl"
                :src="project.thumbnailUrl"
                :alt="project.projectName"
                class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              >
              <div v-else class="flex h-full items-center justify-center">
                <svg class="h-8 w-8 text-text-muted/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
              </div>
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10">
                <span
                  class="rounded-full border px-2.5 py-1 text-[11px] backdrop-blur-sm"
                  :class="project.hasFinalVariants
                    ? 'border-accent/40 bg-accent/20 text-white'
                    : project.conceptCount
                      ? 'border-[#7a5b22]/50 bg-[#2a2118]/80 text-[#ffcc73]'
                      : 'border-white/20 bg-black/30 text-white/70'"
                >
                  {{ projectStatusLabel(project) }}
                </span>
              </div>
            </div>

            <div class="px-5 pt-5 pb-4">
              <div class="flex items-start justify-between gap-3">
                <h3 class="text-sm font-medium text-text transition group-hover:text-accent">
                  {{ project.projectName }}
                </h3>
                <span class="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                  {{ formatDate(project.updatedAt) }}
                </span>
              </div>

              <p class="mt-2 line-clamp-1 text-xs leading-5 text-text-muted">
                {{ project.goal }}
              </p>
            </div>

            <div class="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
              <span class="text-[11px] text-text-muted">
                {{ project.conceptCount ? `${project.conceptCount} ${project.conceptCount === 1 ? 'concepto' : 'conceptos'}` : 'Sin conceptos' }}
              </span>
              <span class="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted/80">
                Abrir
              </span>
            </div>
          </NuxtLink>
        </div>

        <nav
          v-if="pagination.totalPages > 1"
          class="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"
          aria-label="Paginacion de proyectos"
        >
          <p class="text-xs text-text-muted">
            Pagina {{ pagination.page }} de {{ pagination.totalPages }} · {{ pagination.totalProjects }} proyectos
          </p>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-lg border border-border px-3 py-2 text-sm text-text-muted transition hover:border-accent/30 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!pagination.hasPreviousPage"
              @click="goToPage(pagination.page - 1)"
            >
              Anterior
            </button>

            <button
              v-for="pageNumber in visiblePageNumbers"
              :key="pageNumber"
              type="button"
              class="min-w-10 rounded-lg border px-3 py-2 text-sm transition"
              :class="pageNumber === pagination.page
                ? 'border-accent/40 bg-accent/10 text-text'
                : 'border-border text-text-muted hover:border-accent/30 hover:text-text'"
              @click="goToPage(pageNumber)"
            >
              {{ pageNumber }}
            </button>

            <button
              type="button"
              class="rounded-lg border border-border px-3 py-2 text-sm text-text-muted transition hover:border-accent/30 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!pagination.hasNextPage"
              @click="goToPage(pagination.page + 1)"
            >
              Siguiente
            </button>
          </div>
        </nav>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StudioProjectListItem, StudioProjectListResponse } from '../../../shared/types/studio'

const projects = ref<StudioProjectListItem[]>([])
const loadingProjects = ref(true)
const pagination = ref<StudioProjectListResponse['pagination']>({
  page: 1,
  pageSize: 6,
  totalProjects: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false
})

const route = useRoute()
const router = useRouter()
const routePage = computed(() => {
  const rawPage = Array.isArray(route.query.page) ? route.query.page[0] : route.query.page
  const parsedPage = Number(rawPage || 1)

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
})

const visiblePageNumbers = computed(() => {
  const totalPages = pagination.value.totalPages
  const currentPage = pagination.value.page
  const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2))
  const end = Math.min(totalPages, start + 2)
  const pages: number[] = []

  for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
    pages.push(pageNumber)
  }

  return pages
})

onMounted(async () => {
  await loadProjects()
})

watch(routePage, async () => {
  await loadProjects()
})

async function loadProjects() {
  loadingProjects.value = true
  try {
    const response = await $fetch<StudioProjectListResponse>('/api/studio/projects', {
      query: { page: routePage.value }
    })

    projects.value = response.projects
    pagination.value = response.pagination

    if (routePage.value !== response.pagination.page) {
      await router.replace({
        path: '/studio',
        query: response.pagination.page > 1 ? { page: String(response.pagination.page) } : {}
      })
    }
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
  if (project.hasFinalVariants) return 'Con artes'
  if (project.conceptCount) return 'En exploracion'
  return 'Solo brief'
}

async function goToPage(page: number) {
  if (page < 1 || page > pagination.value.totalPages || page === pagination.value.page) {
    return
  }

  await router.push({
    path: '/studio',
    query: page > 1 ? { page: String(page) } : {}
  })
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}
</script>

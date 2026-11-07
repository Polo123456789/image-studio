<template>
  <div class="min-h-screen bg-bg pb-[calc(76px+env(safe-area-inset-bottom))] text-text lg:pb-0">
    <NuxtRouteAnnouncer />
    <StudioRegenerationTray />

    <!-- Mobile top bar -->
    <header :inert="mobileOpen" class="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
      <NuxtLink to="/studio" class="flex items-center gap-2">
        <div class="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15">
          <svg class="h-3.5 w-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
        </div>
        <span class="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">Image Studio</span>
      </NuxtLink>

      <button
        type="button"
        aria-label="Abrir menú de navegación" aria-controls="mobile-navigation" :aria-expanded="mobileOpen" class="flex h-12 w-12 items-center justify-center rounded-md border border-border p-1.5 text-text-muted transition hover:border-accent/30 hover:text-text"
        @click="mobileOpen = !mobileOpen"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
      </button>
    </header>

    <!-- Mobile overlay -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mobileOpen"
        class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        @click="mobileOpen = false"
      />
    </Transition>

    <div class="flex min-h-screen">
      <!-- Sidebar -->
      <aside
        id="mobile-navigation"
        ref="navigationPanel"
        :role="mobileOpen ? 'dialog' : undefined"
        :aria-modal="mobileOpen || undefined"
        aria-label="Navegación"
        @keydown="onNavigationKeydown"
        class="fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col border-r border-border bg-surface transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0"
        :class="mobileOpen ? 'translate-x-0' : '-translate-x-full invisible lg:visible'"
      >
        <button type="button" class="m-3 rounded-lg border border-border px-4 py-2 text-sm text-text-muted lg:hidden" aria-label="Cerrar menú de navegación" @click="mobileOpen = false">Cerrar menú ×</button>
        <!-- Logo -->
        <div class="hidden px-5 pt-6 pb-4 lg:block">
          <NuxtLink to="/studio" class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
              <svg class="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
            </div>
            <span class="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">Image Studio</span>
          </NuxtLink>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 space-y-1 px-3 py-4">
          <p class="mb-2 px-2 font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted/60">Produccion</p>

          <NuxtLink
            v-for="item in mainNav"
            :key="item.to"
            :to="item.to"
            class="group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition"
            :class="isActive(item.to) ? 'bg-accent/10 text-text' : 'text-text-muted hover:bg-surface-2 hover:text-text'"
            @click="mobileOpen = false"
          >
            <div
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition"
              :class="isActive(item.to) ? 'bg-accent/20 text-accent' : 'bg-surface-2 text-text-muted group-hover:text-text'"
            >
              <svg v-if="item.icon === 'studio'" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
              <svg v-else-if="item.icon === 'library'" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 17a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.9a2 2 0 0 1-1.69-.9l-.81-1.2a2 2 0 0 0-1.67-.9H8a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z" /><path d="M2 8v11a2 2 0 0 0 2 2h14" /></svg>
              <svg v-else-if="item.icon === 'assets'" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg>
              <svg v-else-if="item.icon === 'styles'" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" /><path d="M2 12C2 6.5 6.5 2 12 2" /><circle cx="12" cy="12" r="3" /></svg>
              <svg v-else class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
            </div>
            <span>{{ item.label }}</span>
            <span
              v-if="isActive(item.to)"
              class="ml-auto h-1.5 w-1.5 rounded-full bg-accent"
            />
          </NuxtLink>

          <div class="my-4 border-t border-border" />

          <p class="mb-2 px-2 font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted/60">Sistema</p>

          <NuxtLink
            to="/settings"
            class="group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition"
            :class="isActive('/settings') ? 'bg-accent/10 text-text' : 'text-text-muted hover:bg-surface-2 hover:text-text'"
            @click="mobileOpen = false"
          >
            <div
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition"
              :class="isActive('/settings') ? 'bg-accent/20 text-accent' : 'bg-surface-2 text-text-muted group-hover:text-text'"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
            </div>
            <span>Configuracion</span>
          </NuxtLink>
        </nav>

        <!-- Bottom: theme toggle -->
        <div class="border-t border-border px-3 py-3">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-text-muted transition hover:bg-surface-2 hover:text-text"
            @click="toggleTheme"
          >
            <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-2 text-text-muted">
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
            </div>
            <span>Cambiar tema</span>
          </button>
        </div>
      </aside>

      <nav :inert="mobileOpen" aria-label="Navegación móvil" class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        <NuxtLink v-for="item in mainNav.slice(0, 3)" :key="item.to" :to="item.to" :aria-current="isActive(item.to) ? 'page' : undefined" class="flex min-h-[76px] flex-col items-center justify-center gap-1 text-xs" :class="isActive(item.to) ? 'text-accent' : 'text-text-muted'"><span aria-hidden="true" class="text-xl">{{ item.icon === 'studio' ? '▧' : item.icon === 'library' ? '▦' : '+' }}</span>{{ item.label }}</NuxtLink>
        <button type="button" :aria-expanded="mobileOpen" aria-label="Más secciones" aria-controls="mobile-navigation" class="flex min-h-[76px] flex-col items-center justify-center gap-1 text-xs text-text-muted" @click="mobileOpen = !mobileOpen"><span aria-hidden="true" class="text-xl">•••</span>Más</button>
      </nav>
      <!-- Main content -->
      <main :inert="mobileOpen" class="min-w-0 flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import StudioRegenerationTray from '~/components/studio/StudioRegenerationTray.vue'
const route = useRoute()
const navigationPanel = ref<HTMLElement | null>(null)
const mobileOpen = ref(false)
let navigationTrigger: HTMLElement | null = null
watch(mobileOpen, async open => {
  if (open) navigationTrigger = document.activeElement as HTMLElement | null
  await nextTick()
  if (open) Array.from(navigationPanel.value?.querySelectorAll<HTMLElement>('a, button') ?? []).find(element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden')?.focus()
  else if (navigationTrigger?.isConnected) navigationTrigger.focus()
})
function onNavigationKeydown(event: KeyboardEvent) {
  if (!mobileOpen.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    mobileOpen.value = false
  } else if (event.key === 'Tab') {
    const items = Array.from(navigationPanel.value?.querySelectorAll<HTMLElement>('a, button:not([disabled])') ?? []).filter(element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden')
    const first = items[0]
    const last = items.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }
}
useBodyScrollLock(() => mobileOpen.value)
onMounted(() => {
  const desktop = window.matchMedia('(min-width: 1024px)')
  const closeOnDesktop = () => { if (desktop.matches) mobileOpen.value = false }
  desktop.addEventListener('change', closeOnDesktop)
  onBeforeUnmount(() => desktop.removeEventListener('change', closeOnDesktop))
})

watch(() => route.fullPath, () => {
  mobileOpen.value = false
})

function isActive(path: string) {
  if (path === '/studio') {
    return route.path === '/studio' || route.path.startsWith('/studio/')
  }
  return route.path.startsWith(path)
}

function toggleTheme() {
  document.documentElement.classList.toggle('light')
}

const mainNav = [
  { to: '/studio', label: 'Estudio', icon: 'studio' },
  { to: '/library', label: 'Biblioteca', icon: 'library' },
  { to: '/assets', label: 'Assets', icon: 'assets' },
  { to: '/styles', label: 'Guias de estilo', icon: 'styles' },
  { to: '/brands', label: 'Marcas', icon: 'brands' },
]
</script>

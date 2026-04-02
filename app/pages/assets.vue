<template>
  <div class="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
    <div class="mx-auto max-w-4xl">
      <header class="mb-12">
        <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Assets</p>
        <h1 class="mt-3 font-display text-3xl text-text">Gestion de assets</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
          Sube logos, fotos de producto, texturas y cualquier recurso visual que quieras integrar en las generaciones del estudio.
        </p>
      </header>

      <div class="rounded-xl border border-border bg-surface px-8 py-16 text-center">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
          <svg class="h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.29 7 12 12 20.71 7" />
            <line x1="12" y1="22" x2="12" y2="12" />
          </svg>
        </div>
        <h2 class="mt-5 font-display text-xl text-text">Proximamente</h2>
        <p class="mx-auto mt-3 max-w-md text-sm leading-6 text-text-muted">
          Podras subir y organizar assets por marca. El estudio los utilizara como referencia visual al generar conceptos e imagenes finales.
        </p>
      </div>
    </div>
  </div>
</template>

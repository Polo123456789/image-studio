<template>
  <div class="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
    <div class="mx-auto max-w-4xl">
      <header class="mb-12">
        <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Biblioteca</p>
        <h1 class="mt-3 font-display text-3xl text-text">Biblioteca de imagenes</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
          Galeria centralizada con todas las imagenes generadas, organizadas por proyecto, concepto y formato. Filtra, busca y descarga en un solo lugar.
        </p>
      </header>

      <div class="rounded-xl border border-border bg-surface px-8 py-16 text-center">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
          <svg class="h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 17a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.9a2 2 0 0 1-1.69-.9l-.81-1.2a2 2 0 0 0-1.67-.9H8a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z" />
            <path d="M2 8v11a2 2 0 0 0 2 2h14" />
          </svg>
        </div>
        <h2 class="mt-5 font-display text-xl text-text">Proximamente</h2>
        <p class="mx-auto mt-3 max-w-md text-sm leading-6 text-text-muted">
          La biblioteca se conectara automaticamente con el estudio. Cada imagen generada aparecera aqui con sus metadatos, variantes y opciones de descarga.
        </p>
      </div>
    </div>
  </div>
</template>

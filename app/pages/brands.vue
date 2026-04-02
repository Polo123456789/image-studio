<template>
  <div class="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
    <div class="mx-auto max-w-4xl">
      <header class="mb-12">
        <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Marcas</p>
        <h1 class="mt-3 font-display text-3xl text-text">Gestion de marcas</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
          Registra marcas con su identidad, tono de comunicacion y assets asociados. Los proyectos del estudio pueden vincularse a una marca para heredar su contexto.
        </p>
      </header>

      <div class="rounded-xl border border-border bg-surface px-8 py-16 text-center">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
          <svg class="h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        </div>
        <h2 class="mt-5 font-display text-xl text-text">Proximamente</h2>
        <p class="mx-auto mt-3 max-w-md text-sm leading-6 text-text-muted">
          Agrega marcas con nombre, descripcion, guia de estilo y assets. Al crear un proyecto, podras asociarlo a una marca para que Gemini use su contexto como referencia.
        </p>
      </div>
    </div>
  </div>
</template>

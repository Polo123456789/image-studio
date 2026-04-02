<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-6 px-8">
    <h1 class="font-display text-3xl text-text">
      Image Studio
    </h1>
    <p class="font-body text-base text-text-muted">
      Sistema visual activo — dark studio
    </p>
    <code class="font-mono text-sm text-accent bg-surface px-3 py-1 rounded-md border border-border">
      Fraunces · DM Sans · JetBrains Mono
    </code>
    <button
      class="mt-4 px-4 py-2 rounded-md bg-accent text-bg font-body text-sm font-medium"
      @click="toggleTheme"
    >
      Cambiar tema
    </button>
  </div>
</template>

<script setup lang="ts">
function toggleTheme() {
  document.documentElement.classList.toggle('light')
}
</script>

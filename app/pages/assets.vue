<template>
  <div class="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
    <div class="mx-auto max-w-6xl">
      <header class="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Assets</p>
          <h1 class="mt-3 font-display text-3xl text-text">Gestion de assets</h1>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
            Sube referencias, logos, productos y fondos reutilizables. Los duplicados se detectan por hash antes de guardar.
          </p>
        </div>

        <div class="flex items-center gap-2 text-xs text-text-muted">
          <span class="rounded border border-border bg-surface px-3 py-1.5 tabular-nums">
            {{ assets.length }} {{ assets.length === 1 ? 'asset' : 'assets' }}
          </span>
          <span class="rounded border border-border bg-surface px-3 py-1.5 tabular-nums">
            {{ globalAssetsCount }} globales
          </span>
          <span class="rounded border border-border bg-surface px-3 py-1.5 tabular-nums">
            {{ brandAssetsCount }} de marca
          </span>
        </div>
      </header>

      <div v-if="pending" class="rounded-xl border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">
        Cargando assets...
      </div>

      <div v-else class="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section class="rounded-xl border border-border bg-surface p-5">
          <StudioAssetSection
            v-model:selected-asset-ids="selectedAssetIds"
            :assets="assets"
            :brands="brandOptions"
            @assets-uploaded="refresh"
          />
        </section>

        <section class="overflow-hidden rounded-xl border border-border bg-surface">
          <div class="border-b border-border px-5 py-4">
            <h2 class="text-lg text-text">Biblioteca</h2>
            <p class="mt-1 text-sm text-text-muted">
              Cada asset queda disponible en el studio para adjuntarlo a nuevas generaciones.
            </p>
          </div>

          <div v-if="assets.length" class="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            <article v-for="asset in assets" :key="asset.id" class="overflow-hidden rounded-xl border border-border bg-surface-2/40">
              <img :src="asset.fileUrl" :alt="asset.name" class="aspect-[4/3] w-full object-cover bg-surface-2">
              <div class="space-y-3 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-sm text-text">{{ asset.name }}</h3>
                    <p class="mt-1 text-xs text-text-muted">{{ asset.originalFileName }}</p>
                  </div>
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    :class="asset.brandId === null ? 'bg-surface text-text-muted' : 'bg-accent/12 text-accent'">
                    {{ asset.brandName ?? 'Global' }}
                  </span>
                </div>

                <p class="line-clamp-3 text-xs leading-5 text-text-muted">
                  {{ asset.description || 'Sin descripcion generada todavia.' }}
                </p>

                <div class="flex flex-wrap gap-1.5">
                  <span v-for="tag in asset.tags" :key="tag" class="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] text-text-muted">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </article>
          </div>

          <div v-else class="px-6 py-16 text-center text-sm text-text-muted">
            Todavia no hay assets cargados.
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AssetsResponse } from '../../shared/types/assets'

import StudioAssetSection from '~/components/studio/StudioAssetSection.vue'

const selectedAssetIds = ref<number[]>([])
const { data, pending, refresh } = await useFetch<AssetsResponse>('/api/assets')

const assets = computed(() => data.value?.assets ?? [])
const brandOptions = computed(() => data.value?.brands ?? [])
const globalAssetsCount = computed(() => assets.value.filter((asset) => asset.brandId === null).length)
const brandAssetsCount = computed(() => assets.value.filter((asset) => asset.brandId !== null).length)
</script>

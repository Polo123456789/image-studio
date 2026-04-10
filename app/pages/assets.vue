<template>
  <div class="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
    <div class="mx-auto max-w-7xl">
      <header class="mb-10">
        <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Biblioteca</p>
        <div class="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 class="font-display text-3xl text-text">Assets</h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
              Sube referencias, logos, productos y fondos reutilizables.
              Los duplicados se detectan por hash antes de guardar.
            </p>
          </div>
          <AppButton class="shrink-0" @click="openUploadModal()">
            Nuevo asset
          </AppButton>
        </div>

        <div class="mt-5 flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2">
            <span class="font-mono text-lg text-text">{{ assets.length }}</span>
            <span class="text-xs text-text-muted">totales</span>
          </div>
          <div class="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2">
            <span class="font-mono text-lg text-text">{{ globalAssetsCount }}</span>
            <span class="text-xs text-text-muted">globales</span>
          </div>
          <div class="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2">
            <span class="font-mono text-lg text-text">{{ brandAssetsCount }}</span>
            <span class="text-xs text-text-muted">de marca</span>
          </div>
          <div class="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2">
            <span class="font-mono text-lg text-text">{{ totalSizeFormatted }}</span>
            <span class="text-xs text-text-muted">almacenado</span>
          </div>
        </div>
      </header>

      <div v-if="pending" class="rounded-xl border border-border bg-surface px-6 py-16 text-center text-sm text-text-muted">
        Cargando assets...
      </div>

      <template v-else>
        <Transition
          enter-active-class="transition duration-300 ease-out"
          leave-active-class="transition duration-200 ease-in"
          enter-from-class="opacity-0 -translate-y-1"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <div
            v-if="notification.message"
            class="mb-6 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm"
            :class="notification.tone === 'error'
              ? 'border-danger/30 bg-danger/8 text-danger'
              : 'border-accent/30 bg-accent/8 text-accent'"
          >
            <span>{{ notification.message }}</span>
            <button
              type="button"
              class="shrink-0 opacity-60 transition hover:opacity-100"
              @click="clearNotification()"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </Transition>

        <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div class="relative flex-1">
            <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              v-model="search"
              type="text"
              placeholder="Buscar por nombre, descripcion o tags..."
              class="w-full rounded-lg border border-border bg-surface-2 py-2.5 pl-10 pr-4 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent"
            >
          </div>

          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="filter in brandFilters"
              :key="filter.id"
              type="button"
              class="shrink-0 rounded-full border px-3 py-1.5 text-xs transition"
              :class="activeBrandFilter === filter.id
                ? 'border-accent/40 bg-accent/12 text-accent'
                : 'border-border text-text-muted hover:border-accent/20 hover:text-text'"
              @click="activeBrandFilter = filter.id"
            >
              {{ filter.label }}
              <span class="ml-1 font-mono text-[10px] opacity-60">{{ filter.count }}</span>
            </button>
          </div>
        </div>

        <div
          v-if="filteredAssets.length"
          class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          <article
            v-for="asset in filteredAssets"
            :key="asset.id"
            class="group overflow-hidden rounded-xl border border-border bg-surface transition hover:border-accent/25 hover:shadow-md"
          >
            <div class="relative aspect-[4/3] overflow-hidden bg-surface-2">
              <img
                :src="asset.fileUrl"
                :alt="asset.name"
                class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              >
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              <span
                class="absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm"
                :class="asset.brandId === null
                  ? 'bg-black/50 text-white/70'
                  : 'bg-accent/80 text-bg'"
              >
                {{ asset.brandName ?? 'Global' }}
              </span>
            </div>

            <div class="p-3.5">
              <h3 class="truncate text-sm font-medium text-text">{{ asset.name }}</h3>
              <p class="mt-0.5 truncate font-mono text-[10px] text-text-muted">
                {{ asset.originalFileName }}
              </p>

              <p
                v-if="asset.description"
                class="mt-2 line-clamp-2 text-xs leading-5 text-text-muted"
              >
                {{ asset.description }}
              </p>

              <div v-if="asset.tags.length" class="mt-2.5 flex flex-wrap gap-1">
                <span
                  v-for="tag in asset.tags.slice(0, 4)"
                  :key="tag"
                  class="rounded-full border border-border px-1.5 py-0.5 text-[9px] text-text-muted"
                >
                  {{ tag }}
                </span>
                <span v-if="asset.tags.length > 4" class="px-1 text-[9px] text-text-muted">
                  +{{ asset.tags.length - 4 }}
                </span>
              </div>

              <div class="mt-3 flex items-center justify-between border-t border-border pt-2.5 font-mono text-[10px] text-text-muted">
                <span>{{ formatFileSize(asset.fileSize) }}</span>
                <span>{{ formatDate(asset.createdAt) }}</span>
              </div>

              <div class="mt-3">
                <div
                  v-if="confirmDeleteId === asset.id"
                  class="flex items-center justify-between gap-2 rounded-lg border border-danger/25 bg-danger/8 px-3 py-2"
                >
                  <p class="truncate font-mono text-[10px] text-danger">Eliminar?</p>
                  <div class="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      class="text-xs text-text-muted transition hover:text-text disabled:opacity-50"
                      :disabled="assetActionId === asset.id"
                      @click="confirmDeleteId = null"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      class="rounded border border-danger/40 px-2 py-0.5 font-mono text-[10px] text-danger transition hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="assetActionId === asset.id"
                      @click="removeAsset(asset)"
                    >
                      {{ assetActionId === asset.id ? '...' : 'Si, eliminar' }}
                    </button>
                  </div>
                </div>

                <div v-else class="flex items-center gap-2">
                  <AppSelect
                    :model-value="assetBrandSelection(asset)"
                    class="flex-1"
                    :disabled="assetActionId === asset.id"
                    @update:model-value="(value) => updateAssetBrand(asset, value)"
                  >
                    <option value="">Global</option>
                    <option v-for="brand in brandOptions" :key="brand.id" :value="String(brand.id)">
                      {{ brand.name }}
                    </option>
                  </AppSelect>

                  <button
                    type="button"
                    class="flex shrink-0 items-center justify-center rounded border border-border p-2.5 text-text-muted transition hover:border-danger/40 hover:bg-danger/5 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="assetActionId === asset.id"
                    :title="`Eliminar ${asset.name}`"
                    @click="confirmDeleteId = asset.id"
                  >
                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="rounded-xl border border-border bg-surface px-8 py-20 text-center">
          <div class="mx-auto max-w-sm">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2">
              <svg class="h-6 w-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
            </div>
            <p class="mt-4 text-sm text-text">
              {{ search.trim() ? 'Sin resultados' : 'Todavia no hay assets' }}
            </p>
            <p class="mt-2 text-xs text-text-muted">
              {{ search.trim()
                ? 'Intenta con otro termino de busqueda.'
                : 'Sube el primer asset desde el boton de nuevo asset.' }}
            </p>
            <AppButton v-if="!search.trim()" class="mt-5" @click="openUploadModal()">
              Nuevo asset
            </AppButton>
          </div>
        </div>
      </template>
    </div>

    <AssetUploadModal
      :open="isUploadModalOpen"
      :brands="brandOptions"
      @close="closeUploadModal()"
      @uploaded="handleUploadComplete"
    />
  </div>
</template>

<script setup lang="ts">
import AppButton from '~/components/base/AppButton.vue'
import AppSelect from '~/components/base/AppSelect.vue'
import AssetUploadModal from '~/components/assets/AssetUploadModal.vue'

const {
  pending,
  assets,
  brandOptions,
  globalAssetsCount,
  brandAssetsCount,
  totalSizeFormatted,
  search,
  activeBrandFilter,
  brandFilters,
  filteredAssets,
  isUploadModalOpen,
  assetActionId,
  confirmDeleteId,
  notification,
  clearNotification,
  openUploadModal,
  closeUploadModal,
  handleUploadComplete,
  assetBrandSelection,
  updateAssetBrand,
  removeAsset,
  formatFileSize,
  formatDate
} = await useAssetLibrary()
</script>

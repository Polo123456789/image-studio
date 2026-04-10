import type { AssetRecord, AssetsResponse, AssetUploadResponse } from '../../shared/types/assets'
import type { BrandOption } from '../../shared/types/brands'

import { getRequestErrorMessage } from '~/utils/http-errors'
import { formatAssetFileSize } from '~/utils/assets'

export async function useAssetLibrary() {
  const { data, pending, refresh } = await useFetch<AssetsResponse>('/api/assets')

  const search = ref('')
  const activeBrandFilter = ref('all')
  const isUploadModalOpen = ref(false)
  const assetActionId = ref<number | null>(null)
  const confirmDeleteId = ref<number | null>(null)
  const notification = reactive<{ message: string, tone: 'success' | 'error' }>({
    message: '',
    tone: 'success'
  })
  let notificationTimer: ReturnType<typeof setTimeout> | null = null

  const assets = computed<AssetRecord[]>(() => data.value?.assets ?? [])
  const brandOptions = computed<BrandOption[]>(() => data.value?.brands ?? [])
  const globalAssetsCount = computed(() => assets.value.filter(a => a.brandId === null).length)
  const brandAssetsCount = computed(() => assets.value.filter(a => a.brandId !== null).length)
  const totalSize = computed(() => assets.value.reduce((sum, asset) => sum + (asset.fileSize || 0), 0))
  const totalSizeFormatted = computed(() => formatAssetFileSize(totalSize.value))

  const brandFilters = computed(() => {
    const filters: { id: string, label: string, count: number }[] = [
      { id: 'all', label: 'Todos', count: assets.value.length },
      { id: 'global', label: 'Global', count: globalAssetsCount.value }
    ]

    const brandCounts = new Map<number, { name: string, count: number }>()

    for (const asset of assets.value) {
      if (asset.brandId !== null && asset.brandName) {
        const existing = brandCounts.get(asset.brandId)

        if (existing) {
          existing.count++
        } else {
          brandCounts.set(asset.brandId, { name: asset.brandName, count: 1 })
        }
      }
    }

    for (const [id, { name, count }] of brandCounts) {
      filters.push({ id: String(id), label: name, count })
    }

    return filters
  })

  const filteredAssets = computed(() => {
    let result = [...assets.value]

    if (activeBrandFilter.value === 'global') {
      result = result.filter(asset => asset.brandId === null)
    } else if (activeBrandFilter.value !== 'all') {
      const brandId = Number(activeBrandFilter.value)
      result = result.filter(asset => asset.brandId === brandId)
    }

    const term = search.value.trim().toLowerCase()

    if (term) {
      result = result.filter((asset) => {
        const haystack = [
          asset.name,
          asset.brandName || '',
          asset.description,
          asset.tags.join(' ')
        ].join(' ').toLowerCase()

        return haystack.includes(term)
      })
    }

    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  })

  function showNotification(message: string, tone: 'success' | 'error' = 'success') {
    if (notificationTimer !== null) {
      clearTimeout(notificationTimer)
    }

    notification.message = message
    notification.tone = tone
    notificationTimer = setTimeout(() => {
      notification.message = ''
      notificationTimer = null
    }, 5000)
  }

  function clearNotification() {
    if (notificationTimer !== null) {
      clearTimeout(notificationTimer)
      notificationTimer = null
    }

    notification.message = ''
  }

  function getErrorMessage(error: unknown) {
    return getRequestErrorMessage(error, 'No se pudo completar la accion sobre el asset.', {
      includeMessage: false
    })
  }

  function openUploadModal() {
    isUploadModalOpen.value = true
  }

  function closeUploadModal() {
    isUploadModalOpen.value = false
  }

  function assetBrandSelection(asset: AssetRecord) {
    return asset.brandId === null ? '' : String(asset.brandId)
  }

  async function handleUploadComplete(response: AssetUploadResponse) {
    const createdCount = response.uploads.filter(upload => !upload.duplicate).length
    const duplicateCount = response.uploads.length - createdCount

    await refresh()

    if (response.uploads.length === 1) {
      showNotification(
        duplicateCount
          ? 'Ese asset ya existia. Se reutilizo la version guardada y se actualizo su marca si hacia falta.'
          : 'Asset subido correctamente.',
        'success'
      )
      return
    }

    showNotification(`Subida completada: ${createdCount} nuevos, ${duplicateCount} reutilizados.`, 'success')
  }

  async function updateAssetBrand(asset: AssetRecord, value: string | number) {
    const nextBrandId = String(value || '').trim()
    const parsedBrandId = nextBrandId ? Number(nextBrandId) : null

    if (parsedBrandId === asset.brandId) {
      return
    }

    assetActionId.value = asset.id

    try {
      await $fetch(`/api/assets/${asset.id}`, {
        method: 'PUT',
        body: { brandId: parsedBrandId }
      })

      await refresh()
      showNotification(`Marca actualizada para ${asset.name}.`, 'success')
    } catch (error) {
      showNotification(getErrorMessage(error), 'error')
    } finally {
      assetActionId.value = null
    }
  }

  async function removeAsset(asset: AssetRecord) {
    assetActionId.value = asset.id

    try {
      await $fetch(`/api/assets/${asset.id}`, {
        method: 'DELETE'
      })

      confirmDeleteId.value = null
      await refresh()
      showNotification(`Asset eliminado: ${asset.name}.`, 'success')
    } catch (error) {
      confirmDeleteId.value = null
      showNotification(getErrorMessage(error), 'error')
    } finally {
      assetActionId.value = null
    }
  }

  onUnmounted(() => {
    if (notificationTimer !== null) {
      clearTimeout(notificationTimer)
    }
  })

  function formatDate(dateStr: string) {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateStr))
  }

  return {
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
    formatFileSize: formatAssetFileSize,
    formatDate
  }
}

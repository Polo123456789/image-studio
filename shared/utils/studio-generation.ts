import type { StudioVariantMode } from '../types/studio'

export function usesStudioPreview(resolution: string) {
  return resolution.includes('4K')
}

export function getStudioExplorationSettings(resolution: string): { resolution: string, mode: StudioVariantMode } {
  return usesStudioPreview(resolution)
    ? { resolution: '1K', mode: 'preview' }
    : { resolution, mode: 'final' }
}

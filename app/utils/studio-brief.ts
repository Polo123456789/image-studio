import type { StudioBriefPayload } from '../../shared/types/studio'

export const studioGoals = [
  'Aumentar ventas',
  'Generar leads',
  'Lanzar un producto',
  'Mejorar reconocimiento de marca',
  'Promocionar una oferta'
]

export const studioMediaChannels = [
  'Google Ads',
  'Instagram Feed',
  'Instagram Stories',
  'Facebook Ads',
  'TikTok',
  'LinkedIn Ads',
  'Display Banners',
  'Email'
]

export const studioAspectRatios = ['1:1', '4:5', '3:4', '16:9', '9:16', '21:9']
export const studioResolutions = ['1K rapido', '2K estandar', '4K alta calidad']
export const studioConceptCounts = [2, 3, 4, 6]
export const defaultStudioMediaChannels = ['Google Ads', 'Instagram Stories']
export const defaultStudioAspectRatios = ['1:1', '9:16']

export interface StudioBriefFormState {
  brandId: number | null
  projectName: string
  goal: string
  audienceAction: string
  keyMessage: string
  additionalContext: string
  styleGuideNotes: string
  resolution: string
  conceptCount: number
}

export function createStudioBriefFormState(): StudioBriefFormState {
  return {
    brandId: null,
    projectName: '',
    goal: 'Aumentar ventas',
    audienceAction: '',
    keyMessage: '',
    additionalContext: '',
    styleGuideNotes: '',
    resolution: '1K rapido',
    conceptCount: 3
  }
}

export function buildStudioBriefPayload(
  form: StudioBriefFormState,
  selectedMedia: string[],
  selectedRatios: string[],
  selectedStyleGuideId: number | null,
  selectedAssetIds: number[] = [],
  brandName = ''
): StudioBriefPayload {
  return {
    brandId: form.brandId,
    brand: brandName,
    projectName: form.projectName,
    goal: form.goal,
    audienceAction: form.audienceAction,
    keyMessage: form.keyMessage,
    additionalContext: form.additionalContext,
    assetIds: [...selectedAssetIds],
    styleGuideId: selectedStyleGuideId,
    styleGuideNotes: form.styleGuideNotes,
    resolution: form.resolution,
    conceptCount: Number(form.conceptCount),
    mediaChannels: [...selectedMedia],
    aspectRatios: [...selectedRatios]
  }
}

export function applyStudioBriefToForm(
  form: StudioBriefFormState,
  brief: StudioBriefPayload
) {
  const legacyStyleGuideIds = Array.isArray(brief.styleGuideIds) ? brief.styleGuideIds : []

  Object.assign(form, {
    brandId: brief.brandId ?? null,
    projectName: brief.projectName,
    goal: brief.goal,
    audienceAction: brief.audienceAction,
    keyMessage: brief.keyMessage,
    additionalContext: brief.additionalContext,
    styleGuideNotes: brief.styleGuideNotes || '',
    resolution: brief.resolution,
    conceptCount: brief.conceptCount
  })

  return {
    selectedStyleGuideId: brief.styleGuideId ?? legacyStyleGuideIds[0] ?? null,
    selectedMedia: [...brief.mediaChannels],
    selectedRatios: [...brief.aspectRatios]
  }
}

export function summarizeStudioBrief(
  form: StudioBriefFormState,
  selectedMedia: string[],
  selectedRatios: string[],
  selectedStyleGuideId: number | null,
  selectedAssetCount = 0,
  conceptLabel = 'conceptos'
) {
  const project = form.projectName || 'Proyecto sin nombre'
  const channels = selectedMedia.length ? selectedMedia.join(', ') : 'sin medios'
  const ratios = selectedRatios.length ? selectedRatios.join(', ') : 'sin formatos'
  const styleGuides = selectedStyleGuideId ? 'con guia' : 'sin guia'
  const assets = selectedAssetCount ? `${selectedAssetCount} assets` : 'sin assets'

  return `${project} — ${form.goal.toLowerCase()} — ${channels} — ${ratios} — ${styleGuides} — ${assets} — ${form.conceptCount} ${conceptLabel}.`
}

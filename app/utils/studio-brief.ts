import type { StudioBriefMode, StudioBriefPayload } from '../../shared/types/studio'

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
export const studioBriefModes: Array<{ value: StudioBriefMode, label: string }> = [
  { value: 'guided', label: 'Guiado' },
  { value: 'plain', label: 'Plano' }
]

export interface StudioBriefFormState {
  briefMode: StudioBriefMode
  brandId: number | null
  projectName: string
  goal: string
  plainBrief: string
  audienceAction: string
  keyMessage: string
  additionalContext: string
  styleGuideNotes: string
  creativeStyleId: number | null
  resolution: string
  conceptCount: number
}

export function createStudioBriefFormState(): StudioBriefFormState {
  return {
    briefMode: 'guided',
    brandId: null,
    projectName: '',
    goal: 'Aumentar ventas',
    plainBrief: '',
    audienceAction: '',
    keyMessage: '',
    additionalContext: '',
    styleGuideNotes: '',
    creativeStyleId: null,
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
  const briefMode = form.briefMode || 'guided'

  return {
    briefMode,
    brandId: form.brandId,
    brand: brandName,
    projectName: form.projectName,
    goal: form.goal,
    plainBrief: briefMode === 'plain' ? form.plainBrief : '',
    audienceAction: briefMode === 'guided' ? form.audienceAction : '',
    keyMessage: briefMode === 'guided' ? form.keyMessage : '',
    additionalContext: briefMode === 'guided' ? form.additionalContext : '',
    assetIds: [...selectedAssetIds],
    styleGuideId: selectedStyleGuideId,
    styleGuideNotes: form.styleGuideNotes,
    creativeStyleId: selectedStyleGuideId ? null : form.creativeStyleId,
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
  const briefMode = brief.briefMode || 'guided'

  Object.assign(form, {
    briefMode,
    brandId: brief.brandId ?? null,
    projectName: brief.projectName,
    goal: brief.goal,
    plainBrief: brief.plainBrief || '',
    audienceAction: brief.audienceAction || '',
    keyMessage: brief.keyMessage || '',
    additionalContext: brief.additionalContext || '',
    styleGuideNotes: brief.styleGuideNotes || '',
    creativeStyleId: brief.creativeStyleId ?? null,
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
  creativeStyleLabel = '',
  selectedAssetCount = 0,
  conceptLabel = 'conceptos'
) {
  const project = form.projectName || 'Proyecto sin nombre'
  const channels = selectedMedia.length ? selectedMedia.join(', ') : 'sin medios'
  const ratios = selectedRatios.length ? selectedRatios.join(', ') : 'sin formatos'
  const styleGuides = selectedStyleGuideId
    ? 'con guia'
    : creativeStyleLabel
      ? `estilo ${creativeStyleLabel.toLowerCase()}`
      : 'estilo aleatorio'
  const assets = selectedAssetCount ? `${selectedAssetCount} assets` : 'sin assets'
  const mode = form.briefMode === 'plain' ? 'brief plano' : 'brief guiado'

  return `${project} — ${mode} — ${form.goal.toLowerCase()} — ${channels} — ${ratios} — ${styleGuides} — ${assets} — ${form.conceptCount} ${conceptLabel}.`
}

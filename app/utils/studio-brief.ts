import type { StudioBriefPayload } from '../../shared/types/studio'

export const studioBrands = ['Aster Labs', 'Casa Nativa', 'North Bloom']

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
  brand: string
  projectName: string
  goal: string
  audienceAction: string
  keyMessage: string
  additionalContext: string
  resolution: string
  conceptCount: number
}

export function createStudioBriefFormState(): StudioBriefFormState {
  return {
    brand: '',
    projectName: '',
    goal: 'Aumentar ventas',
    audienceAction: '',
    keyMessage: '',
    additionalContext: '',
    resolution: '1K rapido',
    conceptCount: 3
  }
}

export function buildStudioBriefPayload(
  form: StudioBriefFormState,
  selectedMedia: string[],
  selectedRatios: string[]
): StudioBriefPayload {
  return {
    brand: form.brand,
    projectName: form.projectName,
    goal: form.goal,
    audienceAction: form.audienceAction,
    keyMessage: form.keyMessage,
    additionalContext: form.additionalContext,
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
  Object.assign(form, {
    brand: brief.brand,
    projectName: brief.projectName,
    goal: brief.goal,
    audienceAction: brief.audienceAction,
    keyMessage: brief.keyMessage,
    additionalContext: brief.additionalContext,
    resolution: brief.resolution,
    conceptCount: brief.conceptCount
  })

  return {
    selectedMedia: [...brief.mediaChannels],
    selectedRatios: [...brief.aspectRatios]
  }
}

export function summarizeStudioBrief(
  form: StudioBriefFormState,
  selectedMedia: string[],
  selectedRatios: string[],
  conceptLabel = 'conceptos'
) {
  const project = form.projectName || 'Proyecto sin nombre'
  const channels = selectedMedia.length ? selectedMedia.join(', ') : 'sin medios'
  const ratios = selectedRatios.length ? selectedRatios.join(', ') : 'sin formatos'

  return `${project} — ${form.goal.toLowerCase()} — ${channels} — ${ratios} — ${form.conceptCount} ${conceptLabel}.`
}

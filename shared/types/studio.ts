export interface StudioBriefPayload {
  brand: string
  projectName: string
  goal: string
  audienceAction: string
  keyMessage: string
  additionalContext: string
  resolution: string
  conceptCount: number
  mediaChannels: string[]
  aspectRatios: string[]
  conceptOffset?: number
}

export type StudioVariantMode = 'preview' | 'final'

export interface StudioVariant {
  id: string
  label: string
  mode: StudioVariantMode
  prompt: string
  imageUrl: string
  createdAt: string
}

export interface StudioConceptFormat {
  ratio: string
  isPreviewSource: boolean
  promptDraft: string
  variants: StudioVariant[]
  activeVariantId: string | null
}

export interface StudioConcept {
  id: string
  title: string
  subtitle: string
  rationale: string
  selectedRatio: string
  approvedAt: string | null
  formats: StudioConceptFormat[]
}

export interface StudioConceptResponse {
  concepts: StudioConcept[]
}

export interface StudioRegeneratePreviewPayload {
  concept: StudioConcept
  ratio: string
  prompt: string
}

export interface StudioFinalizeConceptPayload {
  concept: StudioConcept
  resolution: string
}

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

export interface StudioProject {
  id: number
  slug: string
  brief: StudioBriefPayload
  concepts: StudioConcept[]
  createdAt: string
  updatedAt: string
}

export interface StudioProjectListItem {
  id: number
  slug: string
  projectName: string
  goal: string
  conceptCount: number
  hasApprovedConcepts: boolean
  createdAt: string
  updatedAt: string
}

export interface StudioProjectListResponse {
  projects: StudioProjectListItem[]
}

export interface StudioProjectResponse {
  project: StudioProject
}

export interface StudioCreateProjectPayload {
  brief: StudioBriefPayload
}

export interface StudioUpdateProjectBriefPayload {
  brief: StudioBriefPayload
}

export interface StudioSaveConceptsPayload {
  concepts: StudioConcept[]
}

export interface StudioGenerateConceptsPayload {
  projectSlug: string
  brief: StudioBriefPayload
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

export interface StudioRegenerateVariantPayload {
  projectSlug: string
  concept: StudioConcept
  ratio: string
  prompt: string
  resolution?: string
}

export interface StudioConceptSeed {
  title: string
  subtitle: string
  rationale: string
  variantPrompts: Record<string, string>
}

export interface StudioFinalizeConceptPayload {
  projectSlug: string
  concept: StudioConcept
  resolution: string
}

export interface StudioBriefPayload {
  brandId: number | null
  brand: string
  projectName: string
  goal: string
  audienceAction: string
  keyMessage: string
  additionalContext: string
  assetIds?: number[]
  styleGuideId?: number | null
  styleGuideIds?: number[]
  styleGuideNotes?: string
  creativeStyleId?: number | null
  resolution: string
  conceptCount: number
  mediaChannels: string[]
  aspectRatios: string[]
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
  hasFinalVariants: boolean
  createdAt: string
  updatedAt: string
}

export interface StudioProjectListResponse {
  projects: StudioProjectListItem[]
}

export interface StudioProjectResponse {
  project: StudioProject
}

export interface StudioConceptMutationResponse {
  concept: StudioConcept
}

export interface StudioConceptListMutationResponse {
  concepts: StudioConcept[]
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

export interface StudioUpdateFormatSelectionPayload {
  conceptId: string
  ratio: string
  activeVariantId: string
}

export interface StudioUpdateFormatPromptPayload {
  conceptId: string
  ratio: string
  promptDraft: string
}

export interface StudioDiscardConceptPayload {
  conceptId: string
}

export interface StudioGenerateConceptsPayload {
  projectSlug: string
  brief: StudioBriefPayload
}

export interface StudioAppendConceptsPayload {
  count: number
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
  creativeStyleId?: number | null
  creativeStyleName?: string | null
  selectedRatio: string
  approvedAt: string | null
  formats: StudioConceptFormat[]
}

export interface StudioConceptResponse {
  concepts: StudioConcept[]
}

export interface StudioRegenerateVariantPayload {
  projectSlug: string
  conceptId: string
  ratio: string
  prompt: string
}

export interface StudioConceptSeed {
  creativeStyleId?: number | null
  creativeStyleName?: string | null
  title: string
  subtitle: string
  rationale: string
  variantPrompts: Record<string, string>
}

export interface StudioGeneratePendingFormatsPayload {
  projectSlug: string
  conceptId: string
}

export interface StudioExportSummaryItem {
  conceptId: string
  conceptTitle: string
  ratio: string
  fileName: string
}

export interface StudioExportResponse {
  files: StudioExportSummaryItem[]
}

export interface LibraryImageVersion {
  id: string
  label: string
  mode: StudioVariantMode
  prompt: string
  imageUrl: string
  createdAt: string
}

export interface LibraryImageItem {
  id: string
  name: string
  projectSlug: string
  projectName: string
  conceptId: string
  conceptTitle: string
  conceptSubtitle: string
  ratio: string
  currentMode: StudioVariantMode
  createdAt: string
  updatedAt: string
  currentVersionId: string
  versions: LibraryImageVersion[]
  collectionKeys: string[]
}

export interface LibraryFolderItem {
  id: string
  name: string
  projectSlug: string
  imageCount: number
  updatedAt: string
  coverImageUrl: string | null
}

export interface LibraryCollectionItem {
  id: string
  name: string
  imageCount: number
}

export interface LibraryResponse {
  folders: LibraryFolderItem[]
  collections: LibraryCollectionItem[]
  images: LibraryImageItem[]
}

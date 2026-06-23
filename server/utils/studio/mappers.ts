import type {
  StudioConcept,
  StudioConceptFormat,
  StudioProject,
  StudioProjectListItem,
  StudioVariant
} from '../../../shared/types/studio'
import type {
  StudioConceptFormatRow,
  StudioConceptRow,
  StudioProjectRow,
  StudioVariantRow
} from './types'
import { parseStoredStudioBrief } from './briefs'
import { requireStudioVariantMode } from './variants'

function formatTimestamp(value: Date | null) {
  return value ? value.toISOString() : null
}

export function mapConceptRows(
  conceptRows: StudioConceptRow[],
  formatRows: StudioConceptFormatRow[],
  variantRows: StudioVariantRow[]
): StudioConcept[] {
  const variantsByFormatId = new Map<number, StudioVariant[]>()

  variantRows.forEach((variant) => {
    const nextVariant: StudioVariant = {
      id: variant.variantKey,
      label: variant.label,
      mode: requireStudioVariantMode(variant.mode),
      prompt: variant.prompt,
      imageUrl: variant.imageUrl,
      createdAt: variant.createdAt.toISOString()
    }
    const variants = variantsByFormatId.get(variant.formatId) || []

    variants.push(nextVariant)
    variantsByFormatId.set(variant.formatId, variants)
  })

  const formatsByConceptId = new Map<number, StudioConceptFormat[]>()

  formatRows.forEach((format) => {
    const nextFormat: StudioConceptFormat = {
      ratio: format.ratio,
      isPreviewSource: format.isPreviewSource,
      promptDraft: format.promptDraft,
      variants: variantsByFormatId.get(format.id) || [],
      activeVariantId: format.activeVariantKey
    }
    const formats = formatsByConceptId.get(format.conceptId) || []

    formats.push(nextFormat)
    formatsByConceptId.set(format.conceptId, formats)
  })

  return conceptRows.map((concept) => {
    const formats = formatsByConceptId.get(concept.id) || []

    return {
      id: concept.conceptKey,
      title: concept.title,
      subtitle: concept.subtitle,
      rationale: concept.rationale,
      creativeStyleId: concept.creativeStyleId,
      creativeStyleName: concept.creativeStyleName,
      selectedRatio: formats[0]?.ratio || '1:1',
      approvedAt: formatTimestamp(concept.approvedAt),
      formats
    }
  })
}

export function mapProject(project: StudioProjectRow, concepts: StudioConcept[]): StudioProject {
  return {
    id: project.id,
    slug: project.slug,
    brief: parseStoredStudioBrief(project.brief),
    concepts,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  }
}

export function mapProjectListItem(
  project: StudioProjectRow,
  data: {
    conceptCount: number
    finalVariantUrl?: string | null
    fallbackVariantUrl?: string | null
    includeThumbnail?: boolean
  }
): StudioProjectListItem {
  const brief = parseStoredStudioBrief(project.brief)

  return {
    id: project.id,
    slug: project.slug,
    projectName: project.projectName,
    goal: brief.goal,
    conceptCount: data.conceptCount,
    hasFinalVariants: Boolean(data.finalVariantUrl),
    thumbnailUrl: data.includeThumbnail ? data.finalVariantUrl || data.fallbackVariantUrl || null : null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  }
}

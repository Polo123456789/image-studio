import { randomUUID } from 'node:crypto'

import type {
  StudioBriefPayload,
  StudioConcept,
  StudioConceptFormat,
  StudioConceptSeed,
  StudioVariant
} from '../../shared/types/studio'
import { generateFinalImage } from './gemini'

function createFinalVariant(
  conceptId: string,
  ratio: string,
  prompt: string,
  resolution: string,
  imageUrl: string
): StudioVariant {
  return {
    id: `${conceptId}-${ratio}-final-1`,
    label: `${ratio} final ${resolution}`,
    mode: 'final',
    prompt,
    imageUrl,
    createdAt: new Date().toISOString()
  }
}

export async function createGeneratedConcept(brief: StudioBriefPayload, seed: StudioConceptSeed): Promise<StudioConcept> {
  const conceptId = `concept-${randomUUID()}`
  const sourceRatio = brief.aspectRatios[0] || '1:1'
  const formats: StudioConceptFormat[] = brief.aspectRatios.map((ratio) => ({
    ratio,
    isPreviewSource: false,
    promptDraft: seed.variantPrompts[ratio] || seed.variantPrompts[sourceRatio] || '',
    variants: [],
    activeVariantId: null
  }))
  const firstFormat = formats[0]

  if (firstFormat) {
    const imageUrl = await generateFinalImage(
      firstFormat.promptDraft,
      firstFormat.ratio,
      brief.resolution,
      brief.assetIds ?? []
    )
    const variant = createFinalVariant(
      conceptId,
      firstFormat.ratio,
      firstFormat.promptDraft,
      brief.resolution,
      imageUrl
    )

    firstFormat.variants = [variant]
    firstFormat.activeVariantId = variant.id
  }

  return {
    id: conceptId,
    title: seed.title,
    subtitle: seed.subtitle,
    rationale: seed.rationale,
    creativeStyleId: seed.creativeStyleId ?? brief.creativeStyleId ?? null,
    creativeStyleName: seed.creativeStyleName ?? null,
    selectedRatio: sourceRatio,
    approvedAt: new Date().toISOString(),
    formats
  }
}

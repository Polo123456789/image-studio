import { randomUUID } from 'node:crypto'

import type {
  StudioBriefPayload,
  StudioConcept,
  StudioConceptFormat,
  StudioConceptSeed
} from '../../shared/types/studio'
import { getStudioExplorationSettings } from '../../shared/utils/studio-generation'
import { createGeneratedVariant } from './studio/variants'
import { generateFinalImage } from './gemini'
import { storeStudioImage, type StoredStudioImage } from './generated-images'
import { getStudioGenerationErrorMessage } from './studio/generation-errors'

export type StoredImageGenerationResult =
  | { image: StoredStudioImage, generationError: null }
  | { image: null, generationError: string }

export async function generateStoredFinalImage(
  prompt: string,
  aspectRatio: string,
  resolution: string,
  assetIds: number[] = [],
  referenceImageUrl?: string
) {
  const generated = await generateFinalImage(prompt, aspectRatio, resolution, assetIds, referenceImageUrl)
  return storeStudioImage(generated.data)
}

export async function generateStoredFinalImageResult(
  prompt: string,
  aspectRatio: string,
  resolution: string,
  assetIds: number[] = [],
  context: Record<string, string> = {},
  referenceImageUrl?: string
): Promise<StoredImageGenerationResult> {
  try {
    return {
      image: await generateStoredFinalImage(prompt, aspectRatio, resolution, assetIds, referenceImageUrl),
      generationError: null
    }
  }
  catch (error) {
    const generationError = getStudioGenerationErrorMessage(error)

    console.error('[studio.image.generation.failed]', {
      ...context,
      aspectRatio,
      generationError
    }, error)

    return {
      image: null,
      generationError
    }
  }
}

export async function createGeneratedConcept(brief: StudioBriefPayload, seed: StudioConceptSeed): Promise<StudioConcept> {
  const generation = getStudioExplorationSettings(brief.resolution)
  const conceptId = `concept-${randomUUID()}`
  const sourceRatio = brief.aspectRatios[0] || '1:1'
  const formats: StudioConceptFormat[] = brief.aspectRatios.map((ratio) => ({
    ratio,
    isPreviewSource: false,
    promptDraft: seed.variantPrompts[ratio] || seed.variantPrompts[sourceRatio] || '',
    generationError: null,
    variants: [],
    activeVariantId: null
  }))
  const firstFormat = formats[0]

  let approvedAt: string | null = null

  if (firstFormat) {
    const result = await generateStoredFinalImageResult(
      firstFormat.promptDraft,
      firstFormat.ratio,
      generation.resolution,
      brief.assetIds ?? [],
      { conceptId, operation: 'initial-concept' }
    )

    if (result.image) {
      const variant = createGeneratedVariant(
        conceptId,
        firstFormat.ratio,
        1,
        generation.mode,
        firstFormat.promptDraft,
        result.image,
        generation.resolution
      )

      firstFormat.variants = [variant]
      firstFormat.activeVariantId = variant.id
      if (generation.mode === 'final') approvedAt = new Date().toISOString()
    }
    else {
      firstFormat.generationError = result.generationError
    }
  }

  return {
    id: conceptId,
    title: seed.title,
    subtitle: seed.subtitle,
    rationale: seed.rationale,
    creativeStyleId: seed.creativeStyleId ?? brief.creativeStyleId ?? null,
    creativeStyleName: seed.creativeStyleName ?? null,
    selectedRatio: sourceRatio,
    approvedAt,
    formats
  }
}

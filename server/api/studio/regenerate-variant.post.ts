import type { StudioConcept, StudioConceptMutationResponse, StudioRegenerateVariantPayload, StudioVariant } from '../../../shared/types/studio'

import { generateFinalImage, generatePreviewImage } from '../../utils/gemini'
import { getStudioConceptById, getStudioProjectBySlug, updateStudioConceptFormat } from '../../utils/studio-projects'

function nextPreviewVariant(concept: StudioConcept, ratio: string, prompt: string, imageUrl: string): StudioVariant {
  const format = concept.formats.find((item) => item.ratio === ratio)
  const nextVersion = (format?.variants.length || 0) + 1

  return {
    id: `${concept.id}-${ratio}-preview-${nextVersion}`,
    label: `Preview ${ratio} v${nextVersion}`,
    mode: 'preview',
    prompt,
    imageUrl,
    createdAt: new Date().toISOString()
  }
}

function nextFinalVariant(concept: StudioConcept, ratio: string, prompt: string, resolution: string, imageUrl: string): StudioVariant {
  const format = concept.formats.find((item) => item.ratio === ratio)
  const nextVersion = (format?.variants.length || 0) + 1

  return {
    id: `${concept.id}-${ratio}-final-${nextVersion}`,
    label: `${ratio} final ${resolution}`,
    mode: 'final',
    prompt,
    imageUrl,
    createdAt: new Date().toISOString()
  }
}

export default defineEventHandler(async (event): Promise<StudioConceptMutationResponse> => {
  const payload = await readBody<StudioRegenerateVariantPayload>(event)
  const project = getStudioProjectBySlug(payload.projectSlug)
  const storedConcept = getStudioConceptById(payload.projectSlug, payload.concept.id)
  const storedFormat = storedConcept.formats.find((format) => format.ratio === payload.ratio)

  if (!storedFormat) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Concept format not found'
    })
  }

  if (storedConcept.approvedAt) {
    const imageUrl = await generateFinalImage(payload.prompt, payload.ratio, payload.resolution || '1K rapido', project.brief.assetIds ?? [])
    const concept = updateStudioConceptFormat(payload.projectSlug, payload.concept.id, payload.ratio, (format, concept) => {
      const variant = nextFinalVariant(concept, payload.ratio, payload.prompt, payload.resolution || '1K rapido', imageUrl)

      return {
        ...format,
        promptDraft: payload.prompt,
        variants: [variant, ...format.variants],
        activeVariantId: variant.id
      }
    })

    return {
      concept
    }
  }

  const imageUrl = await generatePreviewImage(payload.prompt, payload.ratio, project.brief.assetIds ?? [])
  const concept = updateStudioConceptFormat(payload.projectSlug, payload.concept.id, payload.ratio, (format, concept) => {
    const variant = nextPreviewVariant(concept, payload.ratio, payload.prompt, imageUrl)

    return {
      ...format,
      promptDraft: payload.prompt,
      variants: [variant, ...format.variants],
      activeVariantId: variant.id
    }
  })

  return {
    concept
  }
})

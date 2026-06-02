import type { StudioConceptMutationResponse, StudioRegenerateVariantPayload } from '../../../shared/types/studio'

import { generateFinalImage, generatePreviewImage } from '../../utils/gemini'
import { addStudioConceptVariant, getStudioConceptById, getStudioProjectBySlug } from '../../utils/studio-projects'

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
    const resolution = payload.resolution || '1K rapido'
    const imageUrl = await generateFinalImage(payload.prompt, payload.ratio, resolution, project.brief.assetIds ?? [])
    const concept = addStudioConceptVariant(payload.projectSlug, payload.concept.id, payload.ratio, 'final', payload.prompt, imageUrl, resolution)

    return {
      concept
    }
  }

  const imageUrl = await generatePreviewImage(payload.prompt, payload.ratio, project.brief.assetIds ?? [])
  const concept = addStudioConceptVariant(payload.projectSlug, payload.concept.id, payload.ratio, 'preview', payload.prompt, imageUrl)

  return {
    concept
  }
})

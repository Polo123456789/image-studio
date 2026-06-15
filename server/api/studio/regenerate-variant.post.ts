import type { StudioConceptMutationResponse, StudioRegenerateVariantPayload } from '../../../shared/types/studio'

import { generateFinalImage } from '../../utils/gemini'
import { addStudioConceptVariant, getStudioConceptById, getStudioProjectBySlug } from '../../utils/studio-projects'

export default defineEventHandler(async (event): Promise<StudioConceptMutationResponse> => {
  const payload = await readBody<StudioRegenerateVariantPayload>(event)
  const project = getStudioProjectBySlug(payload.projectSlug)
  const storedConcept = getStudioConceptById(payload.projectSlug, payload.conceptId)
  const storedFormat = storedConcept.formats.find((format) => format.ratio === payload.ratio)

  if (!storedFormat) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Concept format not found'
    })
  }

  const imageUrl = await generateFinalImage(payload.prompt, payload.ratio, project.brief.resolution, project.brief.assetIds ?? [])
  const concept = addStudioConceptVariant(
    payload.projectSlug,
    payload.conceptId,
    payload.ratio,
    'final',
    payload.prompt,
    imageUrl,
    project.brief.resolution
  )

  return {
    concept
  }
})

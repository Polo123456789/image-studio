import type { StudioConceptMutationResponse, StudioRegenerateVariantPayload } from '../../../shared/types/studio'

import { addStudioConceptVariant, getStudioConceptById, getStudioProjectBySlug } from '../../utils/studio/repository'
import { generateStoredFinalImage } from '../../utils/studio-generation'

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

  const image = await generateStoredFinalImage(payload.prompt, payload.ratio, project.brief.resolution, project.brief.assetIds ?? [])
  const concept = addStudioConceptVariant(
    payload.projectSlug,
    payload.conceptId,
    payload.ratio,
    'final',
    payload.prompt,
    image,
    project.brief.resolution
  )

  return {
    concept
  }
})

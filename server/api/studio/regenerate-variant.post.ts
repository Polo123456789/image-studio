import type { StudioConceptMutationResponse, StudioRegenerateVariantPayload } from '../../../shared/types/studio'

import {
  addStudioConceptVariant,
  getStudioConceptById,
  getStudioProjectBySlug,
  markStudioConceptFormatGenerationFailed
} from '../../utils/studio/repository'
import { getStudioExplorationSettings } from '../../../shared/utils/studio-generation'
import { generateStoredFinalImageResult } from '../../utils/studio-generation'

export default defineEventHandler(async (event): Promise<StudioConceptMutationResponse> => {
  const payload = await readBody<StudioRegenerateVariantPayload>(event)
  const project = getStudioProjectBySlug(payload.projectSlug)
  const generation = getStudioExplorationSettings(project.brief.resolution)
  const storedConcept = getStudioConceptById(payload.projectSlug, payload.conceptId)
  const storedFormat = storedConcept.formats.find((format) => format.ratio === payload.ratio)

  if (!storedFormat) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Concept format not found'
    })
  }

  const result = await generateStoredFinalImageResult(
    payload.prompt,
    payload.ratio,
    generation.resolution,
    project.brief.assetIds ?? [],
    {
      conceptId: payload.conceptId,
      operation: 'regenerate-variant'
    }
  )

  const concept = result.image
    ? addStudioConceptVariant(
        payload.projectSlug,
        payload.conceptId,
        payload.ratio,
        generation.mode,
        payload.prompt,
        result.image,
        generation.resolution
      )
    : markStudioConceptFormatGenerationFailed(
        payload.projectSlug,
        payload.conceptId,
        payload.ratio,
        payload.prompt,
        result.generationError
      )

  return {
    concept
  }
})

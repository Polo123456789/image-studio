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

  if (payload.targetSize !== undefined && !['1K', '2K', '4K'].includes(payload.targetSize)) {
    throw createError({ statusCode: 400, statusMessage: 'Selecciona un tamaño valido: 1K, 2K o 4K.' })
  }
  const source = payload.sourceVariantId
    ? storedFormat.variants.find(variant => variant.id === payload.sourceVariantId)
    : storedFormat.variants.find(variant => variant.id === storedFormat.activeVariantId)
  if ((payload.sourceVariantId && !source) || (payload.targetSize && !source?.imageUrl)) {
    throw createError({ statusCode: 400, statusMessage: 'Selecciona una imagen de este formato como referencia.' })
  }
  const currentSize = source?.label.match(/\b(1K|2K|4K)\b/)?.[1]
  const resolution = payload.targetSize || currentSize || generation.resolution
  const mode = payload.targetSize ? 'final' : source?.mode || generation.mode

  const result = await generateStoredFinalImageResult(
    payload.targetSize ? source!.prompt : payload.prompt,
    payload.ratio,
    resolution,
    project.brief.assetIds ?? [],
    {
      conceptId: payload.conceptId,
      operation: 'regenerate-variant'
    },
    payload.targetSize ? source!.imageUrl : undefined
  )

  const concept = result.image
    ? addStudioConceptVariant(
        payload.projectSlug,
        payload.conceptId,
        payload.ratio,
        mode,
        payload.targetSize ? source!.prompt : payload.prompt,
        result.image,
        resolution
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

import type {
  StudioConceptMutationResponse,
  StudioGeneratePendingFormatsPayload
} from '../../../shared/types/studio'

import { saveStudioConceptGeneratedVariants, getStudioProjectBySlug } from '../../utils/studio/repository'
import { getStudioExplorationSettings } from '../../../shared/utils/studio-generation'
import { generateStoredFinalImageResult } from '../../utils/studio-generation'

export default defineEventHandler(async (event): Promise<StudioConceptMutationResponse> => {
  const payload = await readBody<StudioGeneratePendingFormatsPayload>(event)
  const project = getStudioProjectBySlug(payload.projectSlug)
  const generation = getStudioExplorationSettings(project.brief.resolution)
  const concept = project.concepts.find((item) => item.id === payload.conceptId)

  if (!concept) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Concept not found'
    })
  }

  const pendingFormats = concept.formats.filter((format) => {
    const activeVariant = format.variants.find((variant) => variant.id === format.activeVariantId)

    return generation.mode === 'preview' ? !activeVariant : activeVariant?.mode !== 'final'
  })

  if (!pendingFormats.length) {
    return { concept }
  }

  const generatedFormats = await Promise.all(pendingFormats.map(async (format) => {
    const result = await generateStoredFinalImageResult(
      format.promptDraft,
      format.ratio,
      generation.resolution,
      project.brief.assetIds ?? [],
      {
        conceptId: payload.conceptId,
        operation: 'pending-format'
      }
    )

    return {
      ratio: format.ratio,
      promptDraft: format.promptDraft,
      ...result
    }
  }))

  return {
    concept: saveStudioConceptGeneratedVariants(
      payload.projectSlug,
      payload.conceptId,
      generatedFormats,
      generation.resolution,
      generation.mode
    )
  }
})

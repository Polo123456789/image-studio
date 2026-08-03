import type {
  StudioConceptMutationResponse,
  StudioGeneratePendingFormatsPayload
} from '../../../shared/types/studio'

import { saveStudioConceptFinalVariants, getStudioProjectBySlug } from '../../utils/studio/repository'
import { generateStoredFinalImageResult } from '../../utils/studio-generation'

export default defineEventHandler(async (event): Promise<StudioConceptMutationResponse> => {
  const payload = await readBody<StudioGeneratePendingFormatsPayload>(event)
  const project = getStudioProjectBySlug(payload.projectSlug)
  const concept = project.concepts.find((item) => item.id === payload.conceptId)

  if (!concept) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Concept not found'
    })
  }

  const pendingFormats = concept.formats.filter((format) => {
    const activeVariant = format.variants.find((variant) => variant.id === format.activeVariantId)

    return activeVariant?.mode !== 'final'
  })

  if (!pendingFormats.length) {
    return { concept }
  }

  const generatedFormats = await Promise.all(pendingFormats.map(async (format) => {
    const result = await generateStoredFinalImageResult(
      format.promptDraft,
      format.ratio,
      project.brief.resolution,
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
    concept: saveStudioConceptFinalVariants(
      payload.projectSlug,
      payload.conceptId,
      generatedFormats,
      project.brief.resolution
    )
  }
})

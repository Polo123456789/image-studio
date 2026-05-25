import type { StudioConceptMutationResponse, StudioUpdateFormatSelectionPayload } from '../../../../../../shared/types/studio'

import { requireSlugParam } from '../../../../../utils/http'
import { updateStudioConcept } from '../../../../../utils/studio-projects'

export default defineEventHandler(async (event): Promise<StudioConceptMutationResponse> => {
  const slug = requireSlugParam(event)
  const payload = await readBody<StudioUpdateFormatSelectionPayload>(event)

  return {
    concept: updateStudioConcept(slug, payload.conceptId, (concept) => {
      const format = concept.formats.find((item) => item.ratio === payload.ratio)

      if (!format) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Concept format not found'
        })
      }

      if (!format.variants.some((variant) => variant.id === payload.activeVariantId)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Variant not found for selected format'
        })
      }

      return {
        ...concept,
        selectedRatio: payload.ratio,
        formats: concept.formats.map((currentFormat) => {
          if (currentFormat.ratio !== payload.ratio) {
            return currentFormat
          }

          return {
            ...currentFormat,
            activeVariantId: payload.activeVariantId
          }
        })
      }
    })
  }
})

import type { StudioConceptMutationResponse, StudioUpdateFormatSelectionPayload } from '../../../../../../shared/types/studio'

import { requireSlugParam } from '../../../../../utils/http'
import { updateStudioConceptSelectedVariant } from '../../../../../utils/studio-projects'

export default defineEventHandler(async (event): Promise<StudioConceptMutationResponse> => {
  const slug = requireSlugParam(event)
  const payload = await readBody<StudioUpdateFormatSelectionPayload>(event)

  return {
    concept: updateStudioConceptSelectedVariant(slug, payload.conceptId, payload.ratio, payload.activeVariantId)
  }
})

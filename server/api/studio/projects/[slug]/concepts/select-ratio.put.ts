import type { StudioConceptMutationResponse, StudioUpdateConceptSelectionPayload } from '../../../../../../shared/types/studio'

import { requireSlugParam } from '../../../../../utils/http'
import { updateStudioConceptSelectedRatio } from '../../../../../utils/studio-projects'

export default defineEventHandler(async (event): Promise<StudioConceptMutationResponse> => {
  const slug = requireSlugParam(event)
  const payload = await readBody<StudioUpdateConceptSelectionPayload>(event)

  return {
    concept: updateStudioConceptSelectedRatio(slug, payload.conceptId, payload.selectedRatio)
  }
})

import type { StudioConceptMutationResponse, StudioUpdateConceptSelectionPayload } from '../../../../../../shared/types/studio'

import { requireSlugParam } from '../../../../../utils/http'
import { getStudioConceptFormatByRatio, updateStudioConcept } from '../../../../../utils/studio-projects'

export default defineEventHandler(async (event): Promise<StudioConceptMutationResponse> => {
  const slug = requireSlugParam(event)
  const payload = await readBody<StudioUpdateConceptSelectionPayload>(event)

  getStudioConceptFormatByRatio(slug, payload.conceptId, payload.selectedRatio)

  return {
    concept: updateStudioConcept(slug, payload.conceptId, (concept) => ({
      ...concept,
      selectedRatio: payload.selectedRatio
    }))
  }
})

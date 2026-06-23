import type { StudioConceptListMutationResponse, StudioDiscardConceptPayload } from '../../../../../../shared/types/studio'

import { requireSlugParam } from '../../../../../utils/http'
import { discardStudioConcept } from '../../../../../utils/studio/repository'

export default defineEventHandler(async (event): Promise<StudioConceptListMutationResponse> => {
  const slug = requireSlugParam(event)
  const payload = await readBody<StudioDiscardConceptPayload>(event)

  return {
    concepts: discardStudioConcept(slug, payload.conceptId)
  }
})

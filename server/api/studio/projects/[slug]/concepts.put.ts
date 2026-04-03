import type { StudioProjectResponse, StudioSaveConceptsPayload } from '../../../../../shared/types/studio'

import { requireSlugParam } from '../../../../utils/http'
import { saveStudioConcepts } from '../../../../utils/studio-projects'

export default defineEventHandler(async (event): Promise<StudioProjectResponse> => {
  const slug = requireSlugParam(event)

  const payload = await readBody<StudioSaveConceptsPayload>(event)

  return {
    project: saveStudioConcepts(slug, payload.concepts)
  }
})

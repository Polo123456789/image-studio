import type { StudioProjectResponse, StudioUpdateProjectBriefPayload } from '../../../../../shared/types/studio'

import { requireSlugParam } from '../../../../utils/http'
import { updateStudioProjectBrief } from '../../../../utils/studio-projects'

export default defineEventHandler(async (event): Promise<StudioProjectResponse> => {
  const slug = requireSlugParam(event)

  const payload = await readBody<StudioUpdateProjectBriefPayload>(event)

  return {
    project: updateStudioProjectBrief(slug, payload.brief)
  }
})

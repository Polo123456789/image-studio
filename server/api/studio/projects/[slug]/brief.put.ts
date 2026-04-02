import type { StudioProjectResponse, StudioUpdateProjectBriefPayload } from '../../../../../shared/types/studio'

import { updateStudioProjectBrief } from '../../../../utils/studio-projects'

export default defineEventHandler(async (event): Promise<StudioProjectResponse> => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project slug is required'
    })
  }

  const payload = await readBody<StudioUpdateProjectBriefPayload>(event)

  return {
    project: updateStudioProjectBrief(slug, payload.brief)
  }
})

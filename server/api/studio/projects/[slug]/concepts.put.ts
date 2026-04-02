import type { StudioProjectResponse, StudioSaveConceptsPayload } from '../../../../../shared/types/studio'

import { saveStudioConcepts } from '../../../../utils/studio-projects'

export default defineEventHandler(async (event): Promise<StudioProjectResponse> => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project slug is required'
    })
  }

  const payload = await readBody<StudioSaveConceptsPayload>(event)

  return {
    project: saveStudioConcepts(slug, payload.concepts)
  }
})

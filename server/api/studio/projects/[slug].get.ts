import type { StudioProjectResponse } from '../../../../shared/types/studio'

import { getStudioProjectBySlug } from '../../../utils/studio-projects'

export default defineEventHandler((event): StudioProjectResponse => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project slug is required'
    })
  }

  return {
    project: getStudioProjectBySlug(slug)
  }
})

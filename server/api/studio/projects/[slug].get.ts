import type { StudioProjectResponse } from '../../../../shared/types/studio'

import { requireSlugParam } from '../../../utils/http'
import { getStudioProjectBySlug } from '../../../utils/studio-projects'

export default defineEventHandler((event): StudioProjectResponse => {
  const slug = requireSlugParam(event)

  return {
    project: getStudioProjectBySlug(slug)
  }
})

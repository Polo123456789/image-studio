import type { StudioProjectListResponse } from '../../../shared/types/studio'

import { listPaginatedStudioProjects } from '../../utils/studio/repository'

export default defineEventHandler((event): StudioProjectListResponse => {
  const query = getQuery(event)
  const page = Number(query.page || 1)

  return listPaginatedStudioProjects(page, 6)
})

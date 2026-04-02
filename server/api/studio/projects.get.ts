import type { StudioProjectListResponse } from '../../../shared/types/studio'

import { listStudioProjects } from '../../utils/studio-projects'

export default defineEventHandler((): StudioProjectListResponse => {
  return {
    projects: listStudioProjects()
  }
})

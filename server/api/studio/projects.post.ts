import type { StudioCreateProjectPayload, StudioProjectResponse } from '../../../shared/types/studio'

import { createStudioProject } from '../../utils/studio-projects'

export default defineEventHandler(async (event): Promise<StudioProjectResponse> => {
  const payload = await readBody<StudioCreateProjectPayload>(event)

  if (!payload.brief.projectName.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project name is required'
    })
  }

  const project = await createStudioProject({
    ...payload.brief,
    projectName: payload.brief.projectName.trim()
  })

  return { project }
})

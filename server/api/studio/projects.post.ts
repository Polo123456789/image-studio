import type { StudioCreateProjectPayload, StudioProjectResponse } from '../../../shared/types/studio'

import { createStudioProject } from '../../utils/studio/repository'

export default defineEventHandler(async (event): Promise<StudioProjectResponse> => {
  const payload = await readBody<StudioCreateProjectPayload>(event)
  const project = await createStudioProject(payload?.brief)

  return { project }
})

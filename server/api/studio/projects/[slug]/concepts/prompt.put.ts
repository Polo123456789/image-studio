import type { StudioConceptMutationResponse, StudioUpdateFormatPromptPayload } from '../../../../../../shared/types/studio'

import { requireSlugParam } from '../../../../../utils/http'
import { updateStudioConceptFormatPrompt } from '../../../../../utils/studio-projects'

export default defineEventHandler(async (event): Promise<StudioConceptMutationResponse> => {
  const slug = requireSlugParam(event)
  const payload = await readBody<StudioUpdateFormatPromptPayload>(event)

  return {
    concept: updateStudioConceptFormatPrompt(slug, payload.conceptId, payload.ratio, payload.promptDraft)
  }
})

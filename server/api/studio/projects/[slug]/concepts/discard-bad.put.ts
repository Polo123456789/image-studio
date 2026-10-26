import type { StudioDiscardBadConceptsResponse } from '../../../../../../shared/types/studio'
import { requireSlugParam } from '../../../../../utils/http'
import { discardBadStudioConcepts } from '../../../../../utils/studio/repository'

export default defineEventHandler(async (event): Promise<StudioDiscardBadConceptsResponse> => {
  const slug = requireSlugParam(event)
  const payload = await readBody<unknown>(event)
  const conceptIds = payload && typeof payload === 'object' && !Array.isArray(payload)
    ? (payload as Record<string, unknown>).conceptIds : undefined
  return { discardedConceptIds: discardBadStudioConcepts(slug, conceptIds) }
})

import type { StudioConceptListMutationResponse, StudioDiscardConceptPayload } from '../../../../../../shared/types/studio'

import { requireSlugParam } from '../../../../../utils/http'
import { getStudioProjectBySlug, saveStudioConcepts } from '../../../../../utils/studio-projects'

export default defineEventHandler(async (event): Promise<StudioConceptListMutationResponse> => {
  const slug = requireSlugParam(event)
  const payload = await readBody<StudioDiscardConceptPayload>(event)
  const project = getStudioProjectBySlug(slug)
  const concepts = project.concepts.filter((concept) => concept.id !== payload.conceptId)

  if (concepts.length === project.concepts.length) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Concept not found'
    })
  }

  return {
    concepts: saveStudioConcepts(slug, concepts).concepts
  }
})

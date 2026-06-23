import type { StudioAppendConceptsPayload, StudioConceptResponse } from '../../../../../../shared/types/studio'

import { generateConceptSeeds } from '../../../../../utils/gemini'
import { requireSlugParam } from '../../../../../utils/http'
import { createGeneratedConcept } from '../../../../../utils/studio-generation'
import { appendStudioConcepts, getStudioProjectBySlug } from '../../../../../utils/studio/repository'

export default defineEventHandler(async (event): Promise<StudioConceptResponse> => {
  const slug = requireSlugParam(event)
  const payload = await readBody<StudioAppendConceptsPayload>(event)
  const project = getStudioProjectBySlug(slug)
  const brief = project.brief
  const conceptCount = Math.max(1, Math.floor(payload.count || 0))
  const seedConcepts = await generateConceptSeeds({
    ...brief,
    conceptCount
  })

  if (!seedConcepts.length) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Gemini did not generate any concepts'
    })
  }

  const generatedConcepts = await Promise.all(
    seedConcepts.slice(0, conceptCount).map((concept) => createGeneratedConcept(brief, concept))
  )

  return {
    concepts: appendStudioConcepts(slug, generatedConcepts)
  }
})

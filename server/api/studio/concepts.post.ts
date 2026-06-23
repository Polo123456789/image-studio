import type { StudioConceptResponse, StudioGenerateConceptsPayload } from '../../../shared/types/studio'

import { generateConceptSeeds } from '../../utils/gemini'
import { createGeneratedConcept } from '../../utils/studio-generation'
import { saveStudioConcepts, updateStudioProjectBrief } from '../../utils/studio/repository'

export default defineEventHandler(async (event): Promise<StudioConceptResponse> => {
  const payload = await readBody<StudioGenerateConceptsPayload>(event)

  const brief = payload.brief

  updateStudioProjectBrief(payload.projectSlug, brief)

  const seedConcepts = await generateConceptSeeds(brief)

  if (!seedConcepts.length) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Gemini did not generate any concepts'
    })
  }

  const generatedConcepts = await Promise.all(
    seedConcepts.slice(0, brief.conceptCount).map((concept) => createGeneratedConcept(brief, concept))
  )

  saveStudioConcepts(payload.projectSlug, generatedConcepts)

  return { concepts: generatedConcepts }
})

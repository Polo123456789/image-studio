import type { StudioConceptMutationResponse, StudioFinalizeConceptPayload } from '../../../shared/types/studio'

import { generateFinalImage } from '../../utils/gemini'
import { approveStudioConceptWithFinalVariants, getStudioProjectBySlug } from '../../utils/studio-projects'

export default defineEventHandler(async (event): Promise<StudioConceptMutationResponse> => {
  const payload = await readBody<StudioFinalizeConceptPayload>(event)
  const project = getStudioProjectBySlug(payload.projectSlug)
  const requestConcept = payload.concept
  const storedConcept = project.concepts.find((concept) => concept.id === payload.concept.id)

  if (!storedConcept) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Concept not found'
    })
  }

  const generatedFormats = await Promise.all(requestConcept.formats.map(async (format) => {
    const imageUrl = await generateFinalImage(format.promptDraft, format.ratio, payload.resolution, project.brief.assetIds ?? [])

    return {
      ratio: format.ratio,
      promptDraft: format.promptDraft,
      imageUrl
    }
  }))

  const concept = approveStudioConceptWithFinalVariants(payload.projectSlug, payload.concept.id, generatedFormats, payload.resolution)

  return {
    concept
  }
})

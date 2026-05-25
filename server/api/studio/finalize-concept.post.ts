import type { StudioConceptMutationResponse, StudioFinalizeConceptPayload, StudioVariant } from '../../../shared/types/studio'

import { generateFinalImage } from '../../utils/gemini'
import { getStudioProjectBySlug, updateStudioConcept } from '../../utils/studio-projects'

function createFinalVariant(conceptId: string, ratio: string, prompt: string, resolution: string, versionNumber: number, imageUrl: string): StudioVariant {
  return {
    id: `${conceptId}-${ratio}-final-${versionNumber}`,
    label: `${ratio} final ${resolution}`,
    mode: 'final',
    prompt,
    imageUrl,
    createdAt: new Date().toISOString()
  }
}

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

  const approvedAt = new Date().toISOString()
  const concept = updateStudioConcept(payload.projectSlug, payload.concept.id, (currentConcept) => ({
    ...currentConcept,
    approvedAt,
    formats: currentConcept.formats.map((format) => {
      const generatedFormat = generatedFormats.find((item) => item.ratio === format.ratio)

      if (!generatedFormat) {
        return format
      }

      const variant = createFinalVariant(
        currentConcept.id,
        format.ratio,
        generatedFormat.promptDraft,
        payload.resolution,
        format.variants.length + 1,
        generatedFormat.imageUrl
      )

      return {
        ...format,
        promptDraft: generatedFormat.promptDraft,
        variants: [variant, ...format.variants],
        activeVariantId: variant.id
      }
    })
  }))

  return {
    concept
  }
})

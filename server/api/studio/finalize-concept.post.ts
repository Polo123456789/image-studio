import type { StudioFinalizeConceptPayload, StudioVariant } from '../../../shared/types/studio'

import { generateFinalImage } from '../../utils/gemini'
import { getStudioProjectBySlug, saveStudioConcepts } from '../../utils/studio-projects'

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

export default defineEventHandler(async (event) => {
  const payload = await readBody<StudioFinalizeConceptPayload>(event)
  const project = getStudioProjectBySlug(payload.projectSlug)
  const storedConcept = project.concepts.find((concept) => concept.id === payload.concept.id)

  if (!storedConcept) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Concept not found'
    })
  }

  const formats = await Promise.all(storedConcept.formats.map(async (format) => {
    const imageUrl = await generateFinalImage(format.promptDraft, format.ratio, payload.resolution, project.brief.assetIds ?? [])

    return {
      ratio: format.ratio,
      variant: createFinalVariant(
        storedConcept.id,
        format.ratio,
        format.promptDraft,
        payload.resolution,
        format.variants.length + 1,
        imageUrl
      )
    }
  }))

  const approvedAt = new Date().toISOString()
  const concepts = project.concepts.map((concept) => {
    if (concept.id !== storedConcept.id) {
      return concept
    }

    return {
      ...concept,
      approvedAt,
      formats: concept.formats.map((format) => {
        const updated = formats.find((item) => item.ratio === format.ratio)

        if (!updated) {
          return format
        }

        return {
          ...format,
          variants: [updated.variant, ...format.variants],
          activeVariantId: updated.variant.id
        }
      })
    }
  })

  saveStudioConcepts(payload.projectSlug, concepts)

  return {
    approvedAt,
    formats
  }
})

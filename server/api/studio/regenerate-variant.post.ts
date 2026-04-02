import type { StudioConcept, StudioRegenerateVariantPayload, StudioVariant } from '../../../shared/types/studio'

import { generateFinalImage, generatePreviewImage } from '../../utils/gemini'
import { getStudioProjectBySlug, saveStudioConcepts } from '../../utils/studio-projects'

function nextPreviewVariant(concept: StudioConcept, ratio: string, prompt: string, imageUrl: string): StudioVariant {
  const format = concept.formats.find((item) => item.ratio === ratio)
  const nextVersion = (format?.variants.length || 0) + 1

  return {
    id: `${concept.id}-${ratio}-preview-${nextVersion}`,
    label: `Preview ${ratio} v${nextVersion}`,
    mode: 'preview',
    prompt,
    imageUrl,
    createdAt: new Date().toISOString()
  }
}

function nextFinalVariant(concept: StudioConcept, ratio: string, prompt: string, resolution: string, imageUrl: string): StudioVariant {
  const format = concept.formats.find((item) => item.ratio === ratio)
  const nextVersion = (format?.variants.length || 0) + 1

  return {
    id: `${concept.id}-${ratio}-final-${nextVersion}`,
    label: `${ratio} final ${resolution}`,
    mode: 'final',
    prompt,
    imageUrl,
    createdAt: new Date().toISOString()
  }
}

export default defineEventHandler(async (event) => {
  const payload = await readBody<StudioRegenerateVariantPayload>(event)
  const project = getStudioProjectBySlug(payload.projectSlug)

  if (payload.concept.approvedAt) {
    const imageUrl = await generateFinalImage(payload.prompt, payload.ratio, payload.resolution || '1K rapido')
    const variant = nextFinalVariant(payload.concept, payload.ratio, payload.prompt, payload.resolution || '1K rapido', imageUrl)

    saveStudioConcepts(payload.projectSlug, project.concepts.map((concept) => {
      if (concept.id !== payload.concept.id) {
        return concept
      }

      return {
        ...concept,
        formats: concept.formats.map((format) => {
          if (format.ratio !== payload.ratio) {
            return format
          }

          return {
            ...format,
            promptDraft: payload.prompt,
            variants: [variant, ...format.variants],
            activeVariantId: variant.id
          }
        })
      }
    }))

    return {
      variant
    }
  }

  const imageUrl = await generatePreviewImage(payload.prompt, payload.ratio)
  const variant = nextPreviewVariant(payload.concept, payload.ratio, payload.prompt, imageUrl)

  saveStudioConcepts(payload.projectSlug, project.concepts.map((concept) => {
    if (concept.id !== payload.concept.id) {
      return concept
    }

    return {
      ...concept,
      formats: concept.formats.map((format) => {
        if (format.ratio !== payload.ratio) {
          return format
        }

        return {
          ...format,
          promptDraft: payload.prompt,
          variants: [variant, ...format.variants],
          activeVariantId: variant.id
        }
      })
    }
  }))

  return {
    variant
  }
})

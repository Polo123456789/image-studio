import type { StudioFinalizeConceptPayload, StudioVariant } from '../../../shared/types/studio'

import { generateFinalImage } from '../../utils/gemini'

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

  const formats = await Promise.all(payload.concept.formats.map(async (format) => {
    const imageUrl = await generateFinalImage(format.promptDraft, format.ratio, payload.resolution)

    return {
      ratio: format.ratio,
      variant: createFinalVariant(
        payload.concept.id,
        format.ratio,
        format.promptDraft,
        payload.resolution,
        format.variants.length + 1,
        imageUrl
      )
    }
  }))

  return {
    approvedAt: new Date().toISOString(),
    formats
  }
})

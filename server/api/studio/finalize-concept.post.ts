import type { StudioFinalizeConceptPayload, StudioVariant } from '../../../shared/types/studio'

function createFinalVariant(conceptId: string, title: string, ratio: string, prompt: string, resolution: string, versionNumber: number): StudioVariant {
  return {
    id: `${conceptId}-${ratio}-final-${versionNumber}`,
    label: `${ratio} final ${resolution}`,
    mode: 'final',
    prompt,
    imageUrl: `https://placehold.co/1400x1400/4f7350/f5f4f0?text=${encodeURIComponent(`${title}\n${ratio}\nGemini 3.1 Image\n${resolution}`)}`,
    createdAt: new Date().toISOString()
  }
}

export default defineEventHandler(async (event) => {
  const payload = await readBody<StudioFinalizeConceptPayload>(event)

  const formats = payload.concept.formats.map((format) => ({
    ratio: format.ratio,
    variant: createFinalVariant(
      payload.concept.id,
      payload.concept.title,
      format.ratio,
      format.promptDraft,
      payload.resolution,
      format.variants.length + 1
    )
  }))

  return {
    approvedAt: new Date().toISOString(),
    formats
  }
})

import type { StudioConcept, StudioRegeneratePreviewPayload, StudioVariant } from '../../../shared/types/studio'

function nextPreviewVariant(concept: StudioConcept, ratio: string, prompt: string): StudioVariant {
  const format = concept.formats.find((item) => item.ratio === ratio)
  const nextVersion = (format?.variants.length || 0) + 1
  const color = nextVersion % 2 === 0 ? '7d9e7e' : '9f8d77'

  return {
    id: `${concept.id}-${ratio}-preview-${nextVersion}`,
    label: `Preview ${ratio} v${nextVersion}`,
    mode: 'preview',
    prompt,
    imageUrl: `https://placehold.co/1200x1200/${color}/f5f4f0?text=${encodeURIComponent(`${concept.title}\n${ratio}\nPreview v${nextVersion}`)}`,
    createdAt: new Date().toISOString()
  }
}

export default defineEventHandler(async (event) => {
  const payload = await readBody<StudioRegeneratePreviewPayload>(event)

  return {
    variant: nextPreviewVariant(payload.concept, payload.ratio, payload.prompt)
  }
})

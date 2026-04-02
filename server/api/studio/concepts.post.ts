import type { StudioBriefPayload, StudioConcept, StudioConceptFormat, StudioConceptResponse, StudioVariant } from '../../../shared/types/studio'

import { generateConceptSeeds, generatePreviewImage } from '../../utils/gemini'

function createVariant(ratio: string, prompt: string, seed: string, imageUrl: string): StudioVariant {
  const label = `Preview ${ratio}`

  return {
    id: `${seed}-preview-1`,
    label,
    mode: 'preview',
    prompt,
    imageUrl,
    createdAt: new Date().toISOString()
  }
}

async function createConcept(payload: StudioBriefPayload, index: number, seedData: { title: string, subtitle: string, rationale: string, variantPrompts: Record<string, string> }): Promise<StudioConcept> {
  const sequence = (payload.conceptOffset || 0) + index
  const previewSourceRatio = payload.aspectRatios[0] || '1:1'
  const formats = await Promise.all(payload.aspectRatios.map(async (ratio): Promise<StudioConceptFormat> => {
    const promptDraft = seedData.variantPrompts[ratio] || seedData.variantPrompts[previewSourceRatio] || ''
    const isPreviewSource = ratio === previewSourceRatio
    const imageUrl = isPreviewSource
      ? await generatePreviewImage(promptDraft, ratio)
      : null
    const variant = imageUrl
      ? createVariant(ratio, promptDraft, `${seedData.title}-${ratio}-${sequence}`, imageUrl)
      : null

    return {
      ratio,
      isPreviewSource,
      promptDraft,
      variants: variant ? [variant] : [],
      activeVariantId: variant?.id || null
    }
  }))

  return {
    id: `concept-${sequence + 1}`,
    title: seedData.title,
    subtitle: seedData.subtitle,
    rationale: seedData.rationale,
    selectedRatio: payload.aspectRatios[0] || '1:1',
    approvedAt: null,
    formats
  }
}

export default defineEventHandler(async (event): Promise<StudioConceptResponse> => {
  const payload = await readBody<StudioBriefPayload>(event)

  const seedConcepts = await generateConceptSeeds(payload)

  if (!seedConcepts.length) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Gemini did not generate any concepts'
    })
  }

  const concepts = await Promise.all(seedConcepts.slice(0, payload.conceptCount).map((concept, index) => createConcept(payload, index, concept)))

  return { concepts }
})

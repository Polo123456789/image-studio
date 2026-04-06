import type { StudioConcept, StudioConceptFormat, StudioConceptResponse, StudioGenerateConceptsPayload, StudioVariant } from '../../../shared/types/studio'

import { generateConceptSeeds, generatePreviewImage } from '../../utils/gemini'
import { getStudioProjectBySlug, saveStudioConcepts, updateStudioProjectBrief } from '../../utils/studio-projects'

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
      ? await generatePreviewImage(promptDraft, ratio, payload.assetIds ?? [])
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
  const payload = await readBody<StudioGenerateConceptsPayload>(event)

  const existingProject = getStudioProjectBySlug(payload.projectSlug)
  const brief = payload.brief

  updateStudioProjectBrief(payload.projectSlug, brief)

  const seedConcepts = await generateConceptSeeds(brief)

  if (!seedConcepts.length) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Gemini did not generate any concepts'
    })
  }

  const generatedConcepts = await Promise.all(seedConcepts.slice(0, brief.conceptCount).map((concept, index) => createConcept(brief, index, concept)))
  const concepts = brief.conceptOffset
    ? [...existingProject.concepts, ...generatedConcepts]
    : generatedConcepts

  saveStudioConcepts(payload.projectSlug, concepts)

  return { concepts }
})

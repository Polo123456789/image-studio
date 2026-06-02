import { randomUUID } from 'node:crypto'

import type { StudioAppendConceptsPayload, StudioConcept, StudioConceptFormat, StudioConceptResponse, StudioVariant } from '../../../../../../shared/types/studio'

import { generateConceptSeeds, generatePreviewImage } from '../../../../../utils/gemini'
import { requireSlugParam } from '../../../../../utils/http'
import { appendStudioConcepts, getStudioProjectBySlug } from '../../../../../utils/studio-projects'

function createVariant(ratio: string, prompt: string, seed: string, imageUrl: string): StudioVariant {
  return {
    id: `${seed}-preview-1`,
    label: `Preview ${ratio}`,
    mode: 'preview',
    prompt,
    imageUrl,
    createdAt: new Date().toISOString()
  }
}

async function createConcept(brief: ReturnType<typeof getStudioProjectBySlug>['brief'], seedData: { creativeStyleId?: number | null, creativeStyleName?: string | null, title: string, subtitle: string, rationale: string, variantPrompts: Record<string, string> }): Promise<StudioConcept> {
  const conceptId = `concept-${randomUUID()}`
  const previewSourceRatio = brief.aspectRatios[0] || '1:1'
  const formats = await Promise.all(brief.aspectRatios.map(async (ratio): Promise<StudioConceptFormat> => {
    const promptDraft = seedData.variantPrompts[ratio] || seedData.variantPrompts[previewSourceRatio] || ''
    const isPreviewSource = ratio === previewSourceRatio
    const imageUrl = isPreviewSource
      ? await generatePreviewImage(promptDraft, ratio, brief.assetIds ?? [])
      : null
    const variant = imageUrl
      ? createVariant(ratio, promptDraft, `${conceptId}-${ratio}`, imageUrl)
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
    id: conceptId,
    title: seedData.title,
    subtitle: seedData.subtitle,
    rationale: seedData.rationale,
    creativeStyleId: seedData.creativeStyleId ?? brief.creativeStyleId ?? null,
    creativeStyleName: seedData.creativeStyleName ?? null,
    selectedRatio: formats[0]?.ratio || '1:1',
    approvedAt: null,
    formats
  }
}

export default defineEventHandler(async (event): Promise<StudioConceptResponse> => {
  const slug = requireSlugParam(event)
  const payload = await readBody<StudioAppendConceptsPayload>(event)
  const project = getStudioProjectBySlug(slug)
  const brief = project.brief
  const conceptCount = Math.max(1, Math.floor(payload.count || 0))
  const seedConcepts = await generateConceptSeeds({
    ...brief,
    conceptCount
  })

  if (!seedConcepts.length) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Gemini did not generate any concepts'
    })
  }

  const generatedConcepts = await Promise.all(seedConcepts.slice(0, conceptCount).map((concept) => createConcept(brief, concept)))

  return {
    concepts: appendStudioConcepts(slug, generatedConcepts)
  }
})

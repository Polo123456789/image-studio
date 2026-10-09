import type { StudioConceptMutationResponse, StudioFinalizeVariantPayload } from '../../../shared/types/studio'
import { usesStudioPreview } from '../../../shared/utils/studio-generation'
import { generateStoredFinalImageResult } from '../../utils/studio-generation'
import {
  addStudioConceptVariant,
  getStudioConceptById,
  getStudioProjectBySlug,
  markStudioConceptFormatGenerationFailed
} from '../../utils/studio/repository'

export default defineEventHandler(async (event): Promise<StudioConceptMutationResponse> => {
  const payload = await readBody<StudioFinalizeVariantPayload>(event)
  if (!payload || ![payload.projectSlug, payload.conceptId, payload.ratio, payload.previewVariantId].every(value => typeof value === 'string' && value.trim())
    || (payload.strategy !== 'reference' && payload.strategy !== 'prompt')) {
    throw createError({ statusCode: 400, statusMessage: 'Selecciona un preview y una opcion de generacion valida.' })
  }

  const project = getStudioProjectBySlug(payload.projectSlug)
  if (!usesStudioPreview(project.brief.resolution)) {
    throw createError({ statusCode: 400, statusMessage: 'La aprobacion en 4K requiere un proyecto con resolucion final 4K.' })
  }

  const storedConcept = getStudioConceptById(payload.projectSlug, payload.conceptId)
  const format = storedConcept.formats.find(item => item.ratio === payload.ratio)
  const preview = format?.variants.find(item => item.id === payload.previewVariantId && item.mode === 'preview')
  if (!preview) {
    throw createError({ statusCode: 400, statusMessage: 'El preview no pertenece a este formato del concepto.' })
  }

  const result = await generateStoredFinalImageResult(
    preview.prompt,
    payload.ratio,
    '4K',
    project.brief.assetIds ?? [],
    { conceptId: payload.conceptId, operation: 'finalize-variant', strategy: payload.strategy },
    payload.strategy === 'reference' ? preview.imageUrl : undefined
  )

  return {
    concept: result.image
      ? addStudioConceptVariant(payload.projectSlug, payload.conceptId, payload.ratio, 'final', preview.prompt, result.image, '4K')
      : markStudioConceptFormatGenerationFailed(payload.projectSlug, payload.conceptId, payload.ratio, format!.promptDraft, result.generationError)
  }
})

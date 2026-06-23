import type {
  StudioBriefMode,
  StudioBriefPayload,
  StudioConcept,
  StudioConceptFormat,
  StudioVariant,
  StudioVariantMode
} from '../../../shared/types/studio'

const briefModes = new Set<StudioBriefMode>(['guided', 'plain'])
const variantModes = new Set<StudioVariantMode>(['preview', 'final'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asOptionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function asNullableNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : []
}

function asNumberArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is number => Number.isInteger(item) && item > 0)
    : []
}

function normalizeBriefMode(value: unknown): StudioBriefMode {
  return typeof value === 'string' && briefModes.has(value as StudioBriefMode)
    ? value as StudioBriefMode
    : 'guided'
}

function throwBadRequest(message: string): never {
  throw createError({
    statusCode: 400,
    statusMessage: message
  })
}

export function normalizeStudioBriefPayload(value: unknown): StudioBriefPayload {
  if (!isRecord(value)) {
    throwBadRequest('El brief del studio es invalido.')
  }

  const briefMode = normalizeBriefMode(value.briefMode)
  const projectName = asString(value.projectName).trim()
  const goal = asString(value.goal).trim()
  const plainBrief = asString(value.plainBrief).trim()
  const audienceAction = asString(value.audienceAction).trim()
  const keyMessage = asString(value.keyMessage).trim()
  const mediaChannels = asStringArray(value.mediaChannels)
  const aspectRatios = asStringArray(value.aspectRatios)
  const conceptCount = Number(value.conceptCount)

  if (!projectName) {
    throwBadRequest('El nombre del proyecto es requerido.')
  }

  if (!goal) {
    throwBadRequest('El objetivo del proyecto es requerido.')
  }

  if (briefMode === 'plain' && !plainBrief) {
    throwBadRequest('El brief plano es requerido.')
  }

  if (!Number.isInteger(conceptCount) || conceptCount <= 0) {
    throwBadRequest('La cantidad de conceptos es invalida.')
  }

  if (!mediaChannels.length) {
    throwBadRequest('Selecciona al menos un canal.')
  }

  if (!aspectRatios.length) {
    throwBadRequest('Selecciona al menos un formato.')
  }

  return {
    briefMode,
    brandId: value.brandId === null ? null : asNullableNumber(value.brandId),
    brand: asString(value.brand).trim(),
    projectName,
    goal,
    plainBrief: briefMode === 'plain' ? plainBrief : '',
    audienceAction: briefMode === 'guided' ? audienceAction : '',
    keyMessage: briefMode === 'guided' ? keyMessage : '',
    additionalContext: briefMode === 'guided' ? asString(value.additionalContext).trim() : '',
    assetIds: asNumberArray(value.assetIds),
    styleGuideId: value.styleGuideId === null ? null : asNullableNumber(value.styleGuideId),
    styleGuideIds: asNumberArray(value.styleGuideIds),
    styleGuideNotes: asOptionalString(value.styleGuideNotes)?.trim(),
    creativeStyleId: value.creativeStyleId === null ? null : asNullableNumber(value.creativeStyleId),
    resolution: asString(value.resolution).trim() || '1K rapido',
    conceptCount,
    mediaChannels,
    aspectRatios
  }
}

export function serializeStudioBrief(brief: StudioBriefPayload) {
  return JSON.stringify(normalizeStudioBriefPayload(brief))
}

export function parseStoredStudioBrief(value: string): StudioBriefPayload {
  try {
    return normalizeStudioBriefPayload(JSON.parse(value) as unknown)
  }
  catch (error) {
    if (isRecord(error) && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'El brief guardado del studio esta corrupto.'
    })
  }
}

function validateVariant(variant: StudioVariant, conceptId: string, ratio: string) {
  if (!variant.id || !variant.label || !variant.prompt || !variant.imageUrl) {
    throwBadRequest('La variante del concepto esta incompleta.')
  }

  if (!variantModes.has(variant.mode)) {
    throwBadRequest('El modo de la variante es invalido.')
  }

  if (!variant.createdAt || Number.isNaN(new Date(variant.createdAt).getTime())) {
    throwBadRequest('La fecha de la variante es invalida.')
  }

  return {
    ...variant,
    id: variant.id.trim() || `${conceptId}-${ratio}-${variant.mode}`,
    label: variant.label.trim(),
    prompt: variant.prompt.trim(),
    imageUrl: variant.imageUrl.trim()
  }
}

function validateFormat(format: StudioConceptFormat, conceptId: string): StudioConceptFormat {
  if (!format.ratio?.trim()) {
    throwBadRequest('El formato del concepto es invalido.')
  }

  const variants = Array.isArray(format.variants)
    ? format.variants.map((variant) => validateVariant(variant, conceptId, format.ratio))
    : []

  if (format.activeVariantId && !variants.some((variant) => variant.id === format.activeVariantId)) {
    throwBadRequest('La variante activa no existe en el formato.')
  }

  return {
    ratio: format.ratio.trim(),
    isPreviewSource: Boolean(format.isPreviewSource),
    promptDraft: format.promptDraft?.trim() || '',
    variants,
    activeVariantId: format.activeVariantId || null
  }
}

export function validateStudioConcepts(value: StudioConcept[]): StudioConcept[] {
  if (!Array.isArray(value)) {
    throwBadRequest('La lista de conceptos es invalida.')
  }

  const conceptIds = new Set<string>()

  return value.map((concept) => {
    if (!concept.id?.trim() || !concept.title?.trim() || !concept.subtitle?.trim() || !concept.rationale?.trim()) {
      throwBadRequest('El concepto esta incompleto.')
    }

    if (conceptIds.has(concept.id)) {
      throwBadRequest('Hay conceptos duplicados en el payload.')
    }

    conceptIds.add(concept.id)

    const formats = Array.isArray(concept.formats)
      ? concept.formats.map((format) => validateFormat(format, concept.id))
      : []

    if (!formats.length) {
      throwBadRequest('Cada concepto debe tener al menos un formato.')
    }

    const selectedRatio = formats.some((format) => format.ratio === concept.selectedRatio)
      ? concept.selectedRatio
      : formats[0]?.ratio || '1:1'

    return {
      id: concept.id.trim(),
      title: concept.title.trim(),
      subtitle: concept.subtitle.trim(),
      rationale: concept.rationale.trim(),
      creativeStyleId: concept.creativeStyleId ?? null,
      creativeStyleName: concept.creativeStyleName ?? null,
      selectedRatio,
      approvedAt: concept.approvedAt || null,
      formats
    }
  })
}

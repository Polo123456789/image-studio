import type { StudioVariant, StudioVariantMode } from '../../../shared/types/studio'

export function isStudioVariantMode(value: string): value is StudioVariantMode {
  return value === 'preview' || value === 'final'
}

export function requireStudioVariantMode(value: string): StudioVariantMode {
  if (isStudioVariantMode(value)) {
    return value
  }

  throw createError({
    statusCode: 500,
    statusMessage: 'El modo guardado de la variante es invalido.'
  })
}

export function createGeneratedVariant(
  conceptId: string,
  ratio: string,
  versionNumber: number,
  mode: StudioVariantMode,
  prompt: string,
  imageUrl: string,
  resolution?: string
): StudioVariant {
  const id = `${conceptId}-${ratio}-${mode}-${versionNumber}`
  const label = mode === 'final'
    ? `${ratio} final ${resolution || '1K rapido'}`
    : `Preview ${ratio} v${versionNumber}`

  return {
    id,
    label,
    mode,
    prompt,
    imageUrl,
    createdAt: new Date().toISOString()
  }
}

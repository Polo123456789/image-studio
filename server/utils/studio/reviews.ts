import { createError } from 'h3'
import type { StudioReviewPayload } from '../../../shared/types/studio'

export function parseStudioReviewPayload(value: unknown): StudioReviewPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw createError({ statusCode: 400, statusMessage: 'La evaluación es inválida.' })
  }
  const payload = value as Record<string, unknown>
  if (!['conceptId', 'ratio', 'variantId'].every(key => typeof payload[key] === 'string' && (payload[key] as string).trim())
    || ![null, 'good', 'bad'].includes(payload.rating as null | string)) {
    throw createError({ statusCode: 400, statusMessage: 'La evaluación requiere una imagen y un valor válido.' })
  }
  return {
    conceptId: (payload.conceptId as string).trim(),
    ratio: (payload.ratio as string).trim(),
    variantId: (payload.variantId as string).trim(),
    rating: payload.rating as StudioReviewPayload['rating']
  }
}

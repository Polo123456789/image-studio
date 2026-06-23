import { describe, expect, test } from 'bun:test'

import type { StudioBriefPayload, StudioConcept } from '../../../shared/types/studio'
import { normalizeStudioBriefPayload, validateStudioConcepts } from './briefs'
import { createGeneratedVariant, requireStudioVariantMode } from './variants'

globalThis.createError = ((input: { statusCode: number, statusMessage: string }) => {
  const error = new Error(input.statusMessage) as Error & { statusCode: number, statusMessage: string }

  error.statusCode = input.statusCode
  error.statusMessage = input.statusMessage

  return error
}) as typeof createError

const baseBrief: StudioBriefPayload = {
  briefMode: 'guided',
  brandId: null,
  brand: '',
  projectName: ' Proyecto demo ',
  goal: ' Aumentar ventas ',
  plainBrief: 'Esto se descarta en modo guiado',
  audienceAction: 'Comprar',
  keyMessage: 'Mensaje',
  additionalContext: 'Contexto',
  assetIds: [1],
  styleGuideId: null,
  styleGuideIds: [],
  styleGuideNotes: '',
  creativeStyleId: null,
  resolution: '1K rapido',
  conceptCount: 2,
  mediaChannels: ['Instagram'],
  aspectRatios: ['1:1']
}

const baseConcept: StudioConcept = {
  id: 'concept-1',
  title: 'Titulo',
  subtitle: 'Subtitulo',
  rationale: 'Razon',
  creativeStyleId: null,
  creativeStyleName: null,
  selectedRatio: '1:1',
  approvedAt: null,
  formats: [
    {
      ratio: '1:1',
      isPreviewSource: false,
      promptDraft: 'Prompt',
      activeVariantId: 'variant-1',
      variants: [
        {
          id: 'variant-1',
          label: 'Final',
          mode: 'final',
          prompt: 'Prompt',
          imageUrl: '/uploads/assets/final.png',
          createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString()
        }
      ]
    }
  ]
}

describe('studio brief normalization', () => {
  test('normalizes guided briefs and removes plain-only content', () => {
    expect(normalizeStudioBriefPayload(baseBrief)).toMatchObject({
      briefMode: 'guided',
      projectName: 'Proyecto demo',
      goal: 'Aumentar ventas',
      plainBrief: '',
      audienceAction: 'Comprar',
      keyMessage: 'Mensaje',
      mediaChannels: ['Instagram'],
      aspectRatios: ['1:1']
    })
  })

  test('requires plain brief content in plain mode', () => {
    expect(() => normalizeStudioBriefPayload({
      ...baseBrief,
      briefMode: 'plain',
      plainBrief: '   '
    })).toThrow('El brief plano es requerido.')
  })
})

describe('studio concept validation', () => {
  test('accepts a complete concept and preserves active variants', () => {
    expect(validateStudioConcepts([baseConcept])).toEqual([baseConcept])
  })

  test('rejects an active variant id that is not present in the format', () => {
    expect(() => validateStudioConcepts([
      {
        ...baseConcept,
        formats: [
          {
            ...baseConcept.formats[0]!,
            activeVariantId: 'missing'
          }
        ]
      }
    ])).toThrow('La variante activa no existe en el formato.')
  })
})

describe('studio variants', () => {
  test('requires persisted variant modes to be known', () => {
    expect(requireStudioVariantMode('final')).toBe('final')
    expect(() => requireStudioVariantMode('draft')).toThrow('El modo guardado de la variante es invalido.')
  })

  test('creates generated variant labels consistently', () => {
    expect(createGeneratedVariant('concept-1', '9:16', 2, 'final', 'Prompt', '/image.png', '2K')).toMatchObject({
      id: 'concept-1-9:16-final-2',
      label: '9:16 final 2K',
      mode: 'final'
    })
  })
})

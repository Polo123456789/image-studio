import { describe, expect, test } from 'bun:test'

import { getStudioGenerationErrorMessage } from './generation-errors'

describe('studio generation errors', () => {
  test('extracts Gemini status, code, and provider message', () => {
    const error = Object.assign(new Error(JSON.stringify({
      error: {
        code: 503,
        message: 'This model is currently experiencing high demand. Please try again later.',
        status: 'UNAVAILABLE'
      }
    })), {
      name: 'ApiError',
      status: 503
    })

    expect(getStudioGenerationErrorMessage(error)).toBe(
      'Gemini (503 UNAVAILABLE): This model is currently experiencing high demand. Please try again later.'
    )
  })

  test('preserves safe server status messages', () => {
    expect(getStudioGenerationErrorMessage({
      statusCode: 502,
      statusMessage: 'Gemini no devolvio una imagen valida.'
    })).toBe('Gemini no devolvio una imagen valida.')
  })

  test('does not expose unknown internal errors', () => {
    expect(getStudioGenerationErrorMessage(new Error('/private/path could not be written')))
      .toBe('No se pudo generar esta imagen. Intenta nuevamente.')
  })

  test('limits persisted provider errors', () => {
    const message = 'x'.repeat(2000)
    const error = new Error(JSON.stringify({ error: { code: 503, status: 'UNAVAILABLE', message } }))

    expect(getStudioGenerationErrorMessage(error)).toHaveLength(1000)
  })
})

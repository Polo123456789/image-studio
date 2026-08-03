const maxGenerationErrorLength = 1000
const fallbackGenerationError = 'No se pudo generar esta imagen. Intenta nuevamente.'

interface ProviderErrorDetails {
  code?: number
  status?: string
  message?: string
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null
}

function parseProviderErrorMessage(value: unknown): ProviderErrorDetails | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  try {
    const parsed = toRecord(JSON.parse(value))
    const details = toRecord(parsed?.error)

    if (!details) {
      return null
    }

    return {
      code: typeof details.code === 'number' ? details.code : undefined,
      status: typeof details.status === 'string' ? details.status : undefined,
      message: typeof details.message === 'string' ? details.message : undefined
    }
  }
  catch {
    return null
  }
}

function truncate(value: string) {
  return value.trim().slice(0, maxGenerationErrorLength)
}

export function getStudioGenerationErrorMessage(error: unknown) {
  const candidate = toRecord(error)
  const parsedProviderError = parseProviderErrorMessage(candidate?.message)

  if (parsedProviderError?.message) {
    const code = parsedProviderError.code
      ?? (typeof candidate?.status === 'number' ? candidate.status : undefined)
    const label = [code, parsedProviderError.status].filter(Boolean).join(' ')

    return truncate(`Gemini${label ? ` (${label})` : ''}: ${parsedProviderError.message}`)
  }

  if (typeof candidate?.statusMessage === 'string' && candidate.statusMessage.trim()) {
    return truncate(candidate.statusMessage)
  }

  if (candidate?.name === 'ApiError' && typeof candidate.message === 'string' && candidate.message.trim()) {
    const code = typeof candidate.status === 'number' ? ` (${candidate.status})` : ''

    return truncate(`Gemini${code}: ${candidate.message}`)
  }

  return fallbackGenerationError
}

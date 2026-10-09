function sanitizeErrorLog(value: string) {
  return value
    .replace(/\bAIza[\w-]+\b/g, '[REDACTED]')
    .replace(/\bBearer\s+[\w.~+\/-]+=*/gi, 'Bearer [REDACTED]')
    .replace(/((?:api[_-]?key|x-goog-api-key|authorization|token|secret|password)["']?\s*[:=]\s*["']?)[^\s"',&}]+/gi, '$1[REDACTED]')
}

export function logServerError(label: string, error: unknown, context: Record<string, string | number> = {}) {
  const details = typeof error === 'object' && error !== null
    ? error as { name?: string, statusCode?: number, status?: number, statusMessage?: string, message?: string, stack?: string }
    : null

  // Log error text and context only, never SDK request objects, headers or bodies.
  console.error(label, {
    ...Object.fromEntries(Object.entries(context).map(([key, value]) => [
      key, typeof value === 'string' ? sanitizeErrorLog(value) : value
    ])),
    statusCode: details?.statusCode ?? details?.status ?? 500,
    name: details?.name || 'Error',
    message: sanitizeErrorLog(details?.message || details?.statusMessage || String(error)).slice(0, 2000),
    ...(details?.stack ? { stack: sanitizeErrorLog(details.stack).slice(0, 4000) } : {})
  })
}

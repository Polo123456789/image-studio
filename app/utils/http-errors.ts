export function getRequestErrorMessage(error: unknown, fallback: string, options: { includeMessage?: boolean } = {}) {
  if (typeof error === 'object' && error !== null) {
    const maybeStatusMessage = 'statusMessage' in error ? error.statusMessage : undefined

    if (typeof maybeStatusMessage === 'string' && maybeStatusMessage) {
      return maybeStatusMessage
    }

    const maybeData = 'data' in error ? error.data : undefined

    if (typeof maybeData === 'object' && maybeData !== null && 'statusMessage' in maybeData) {
      const nestedStatusMessage = maybeData.statusMessage

      if (typeof nestedStatusMessage === 'string' && nestedStatusMessage) {
        return nestedStatusMessage
      }
    }

    if (options.includeMessage !== false) {
      const maybeMessage = 'message' in error ? error.message : undefined

      if (typeof maybeMessage === 'string' && maybeMessage) {
        return maybeMessage
      }
    }
  }

  return fallback
}

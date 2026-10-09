function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null
}

function nonEmptyMessage(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function getRequestErrorMessage(error: unknown, fallback: string, options: { includeMessage?: boolean } = {}) {
  const candidate = asRecord(error)
  const response = asRecord(candidate?.response)
  const data = asRecord(candidate?.data ?? response?._data)

  // ofetch's HTTP status text can be generic; the response body carries the backend detail.
  return nonEmptyMessage(data?.statusMessage)
    || nonEmptyMessage(data?.message)
    || nonEmptyMessage(candidate?.statusMessage)
    || (options.includeMessage !== false ? nonEmptyMessage(candidate?.message) : undefined)
    || fallback
}

export async function getDownloadErrorMessage(error: unknown, fallback: string) {
  const candidate = asRecord(error)
  const data = candidate?.data
  if (data instanceof Blob) {
    try {
      return getRequestErrorMessage({ ...candidate, data: JSON.parse(await data.text()) }, fallback)
    }
    catch {
      // Non-JSON download failures still retain their HTTP error message.
    }
  }
  return getRequestErrorMessage(error, fallback)
}

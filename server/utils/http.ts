export function requireSlugParam(event: Parameters<typeof getRouterParam>[0]) {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project slug is required'
    })
  }

  return slug
}

export function requireSameOriginRequest(event: Parameters<typeof getRequestHost>[0]) {
  const method = getMethod(event)

  if (method !== 'GET' && method !== 'POST') {
    return
  }

  const originHeader = getHeader(event, 'origin')
  const host = getRequestHost(event)
  const protocol = getRequestProtocol(event, { xForwardedProto: true })
  const expectedOrigin = `${protocol}://${host}`

  if (originHeader && originHeader !== expectedOrigin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Origen no permitido para esta operacion.'
    })
  }
}

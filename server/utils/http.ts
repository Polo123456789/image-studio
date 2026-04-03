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

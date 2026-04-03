export function requireStudioSlug(route: ReturnType<typeof useRoute>) {
  const slug = typeof route.params.slug === 'string' ? route.params.slug : ''

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project slug is required'
    })
  }

  return slug
}

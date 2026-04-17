import { deleteCreativeStyle } from '../../utils/creative-styles'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || Number.isNaN(Number(id))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid style id.' })
  }

  await deleteCreativeStyle(Number(id))

  return { ok: true }
})

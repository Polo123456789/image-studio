import { deleteStyleGuide } from '../../utils/style-guides'

export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Style guide id is invalid'
    })
  }

  deleteStyleGuide(id)

  return {
    success: true
  }
})

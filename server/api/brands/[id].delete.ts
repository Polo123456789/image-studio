import { deleteBrand } from '../../utils/brands'

export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Brand id is invalid'
    })
  }

  deleteBrand(id)

  return {
    success: true
  }
})

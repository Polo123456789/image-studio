import { deleteAsset } from '../../utils/assets'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Asset id is invalid'
    })
  }

  await deleteAsset(id)

  return {
    success: true
  }
})

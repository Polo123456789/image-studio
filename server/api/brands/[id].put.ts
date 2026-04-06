import type { BrandPayload, BrandRecord } from '../../../shared/types/brands'

import { updateBrand } from '../../utils/brands'

export default defineEventHandler(async (event): Promise<BrandRecord> => {
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Brand id is invalid'
    })
  }

  const payload = await readBody<BrandPayload>(event)

  return updateBrand(id, payload)
})

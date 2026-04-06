import type { BrandPayload, BrandRecord } from '../../../shared/types/brands'

import { createBrand } from '../../utils/brands'

export default defineEventHandler(async (event): Promise<BrandRecord> => {
  const payload = await readBody<BrandPayload>(event)

  return createBrand(payload)
})

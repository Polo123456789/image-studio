import type { BrandsResponse } from '../../../shared/types/brands'

import { getBrands } from '../../utils/brands'

export default defineEventHandler((): BrandsResponse => {
  return getBrands()
})

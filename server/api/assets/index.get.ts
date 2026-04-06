import type { AssetsResponse } from '../../../shared/types/assets'

import { getAssets } from '../../utils/assets'

export default defineEventHandler((): AssetsResponse => {
  return getAssets()
})

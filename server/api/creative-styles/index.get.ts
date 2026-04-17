import type { CreativeStylesResponse } from '../../../shared/types/creative-styles'

import { listCreativeStyles } from '../../utils/creative-styles'

export default defineEventHandler((): CreativeStylesResponse => {
  return listCreativeStyles()
})

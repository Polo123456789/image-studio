import type { StyleGuidesResponse } from '../../../shared/types/style-guides'

import { getStyleGuides } from '../../utils/style-guides'

export default defineEventHandler((): StyleGuidesResponse => {
  return getStyleGuides()
})

import type { StyleGuidePayload, StyleGuideRecord } from '../../../shared/types/style-guides'

import { createStyleGuide } from '../../utils/style-guides'

export default defineEventHandler(async (event): Promise<StyleGuideRecord> => {
  const payload = await readBody<StyleGuidePayload>(event)

  return createStyleGuide(payload)
})

import type { StyleGuidePayload, StyleGuideRecord } from '../../../shared/types/style-guides'

import { updateStyleGuide } from '../../utils/style-guides'

export default defineEventHandler(async (event): Promise<StyleGuideRecord> => {
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Style guide id is invalid'
    })
  }

  const payload = await readBody<StyleGuidePayload>(event)

  return updateStyleGuide(id, payload)
})

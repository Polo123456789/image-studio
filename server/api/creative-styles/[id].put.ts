import type { CreativeStyleInput, CreativeStyleResponse } from '../../../shared/types/creative-styles'

import { updateCreativeStyle } from '../../utils/creative-styles'

export default defineEventHandler(async (event): Promise<CreativeStyleResponse> => {
  const id = getRouterParam(event, 'id')
  const payload = await readBody<CreativeStyleInput>(event)

  if (!id || Number.isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Creative style id is invalid'
    })
  }

  return {
    style: updateCreativeStyle(Number(id), payload)
  }
})

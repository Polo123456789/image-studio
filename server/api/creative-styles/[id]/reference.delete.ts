import type { CreativeStyleResponse } from '../../../../shared/types/creative-styles'

import { deleteCreativeStyleReference } from '../../../utils/creative-styles'

export default defineEventHandler(async (event): Promise<CreativeStyleResponse> => {
  const id = getRouterParam(event, 'id')

  if (!id || Number.isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Creative style id is invalid'
    })
  }

  return {
    style: await deleteCreativeStyleReference(Number(id))
  }
})

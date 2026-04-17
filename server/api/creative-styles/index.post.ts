import type { CreativeStyleInput, CreativeStyleResponse } from '../../../shared/types/creative-styles'

import { createCreativeStyle } from '../../utils/creative-styles'

export default defineEventHandler(async (event): Promise<CreativeStyleResponse> => {
  const payload = await readBody<CreativeStyleInput>(event)

  return {
    style: createCreativeStyle(payload)
  }
})

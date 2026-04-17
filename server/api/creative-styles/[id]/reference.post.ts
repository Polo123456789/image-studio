import type { CreativeStyleResponse } from '../../../../shared/types/creative-styles'

import { uploadCreativeStyleReference } from '../../../utils/creative-styles'

export default defineEventHandler(async (event): Promise<CreativeStyleResponse> => {
  const id = getRouterParam(event, 'id')
  const formData = await readFormData(event)
  const file = formData.get('file')

  if (!id || Number.isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Creative style id is invalid'
    })
  }

  if (!(file instanceof File)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La imagen de referencia es obligatoria.'
    })
  }

  return {
    style: await uploadCreativeStyleReference(Number(id), file)
  }
})

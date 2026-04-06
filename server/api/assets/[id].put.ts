import type { AssetRecord, AssetUpdatePayload } from '../../../shared/types/assets'

import { updateAsset } from '../../utils/assets'

export default defineEventHandler(async (event): Promise<AssetRecord> => {
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Asset id is invalid'
    })
  }

  const payload = await readBody<AssetUpdatePayload>(event)

  return updateAsset(id, payload)
})

import type { AssetUploadResponse } from '../../../shared/types/assets'

import { createAssetFromUpload } from '../../utils/assets'

export default defineEventHandler(async (event): Promise<AssetUploadResponse> => {
  const formData = await readFormData(event)

  return createAssetFromUpload(formData)
})

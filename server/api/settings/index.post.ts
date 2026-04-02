import type { AppSettingsPayload, AppSettingsResponse } from '../../../shared/types/settings'

import { saveAppSettings } from '../../utils/settings'

export default defineEventHandler(async (event): Promise<AppSettingsResponse> => {
  const payload = await readBody<AppSettingsPayload>(event)

  return saveAppSettings(payload)
})

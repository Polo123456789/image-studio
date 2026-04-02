import type { AppSettingsResponse } from '../../../shared/types/settings'

import { getAppSettings } from '../../utils/settings'

export default defineEventHandler((): AppSettingsResponse => {
  return getAppSettings()
})

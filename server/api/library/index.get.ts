import type { LibraryResponse } from '../../../shared/types/studio'

import { getLibraryData } from '../../utils/library'

export default defineEventHandler((): LibraryResponse => {
  return getLibraryData()
})

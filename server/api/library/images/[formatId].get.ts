import type { LibraryImageDetailResponse } from '../../../../shared/types/studio'
import { getLibraryImageDetail } from '../../../utils/library'

export default defineEventHandler((event): LibraryImageDetailResponse => {
  const formatId = Number(getRouterParam(event, 'formatId'))
  if (!Number.isInteger(formatId) || formatId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'La imagen solicitada no es valida.' })
  }
  return { image: getLibraryImageDetail(formatId) }
})

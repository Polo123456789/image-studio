import type { StudioReviewResponse } from '../../../../../shared/types/studio'
import { requireSlugParam } from '../../../../utils/http'
import { reviewStudioVariant } from '../../../../utils/studio/repository'
import { parseStudioReviewPayload } from '../../../../utils/studio/reviews'

export default defineEventHandler(async (event): Promise<StudioReviewResponse> => {
  const slug = requireSlugParam(event)
  const payload = parseStudioReviewPayload(await readBody<unknown>(event))
  return reviewStudioVariant(slug, payload)
})

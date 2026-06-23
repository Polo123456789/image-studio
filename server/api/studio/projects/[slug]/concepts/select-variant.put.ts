import type { StudioUpdateFormatSelectionPayload } from '../../../../../../shared/types/studio'

import { requireSlugParam } from '../../../../../utils/http'
import { updateStudioConceptSelectedVariant } from '../../../../../utils/studio/repository'

export default defineEventHandler(async (event): Promise<{ ok: true }> => {
  const slug = requireSlugParam(event)
  const payload = await readBody<StudioUpdateFormatSelectionPayload>(event)

  updateStudioConceptSelectedVariant(slug, payload.conceptId, payload.ratio, payload.activeVariantId)

  return { ok: true }
})

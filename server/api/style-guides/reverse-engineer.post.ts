import type { ReverseEngineeredStyleGuideResponse } from '../../../shared/types/style-guides'

import { reverseEngineerStyleGuide } from '../../utils/gemini'

const maxFiles = 8

export default defineEventHandler(async (event): Promise<ReverseEngineeredStyleGuideResponse> => {
  const formData = await readFormData(event)
  const description = String(formData.get('description') || '').trim()
  const files = [
    ...formData.getAll('files'),
    ...(!formData.has('files') ? formData.getAll('file') : [])
  ].filter((value): value is File => value instanceof File)

  if (!files.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one reference image is required'
    })
  }

  if (files.length > maxFiles) {
    throw createError({
      statusCode: 400,
      statusMessage: `You can upload up to ${maxFiles} images per analysis`
    })
  }

  const content = await reverseEngineerStyleGuide(files, description)

  return { content }
})

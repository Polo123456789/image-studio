import type { StudioBriefPayload } from '../../shared/types/studio'

export const studioDraftStorageKey = 'image-studio:brief-draft:v1'

export function parseStudioDraft(raw: string | null): StudioBriefPayload {
  const value: unknown = JSON.parse(raw || 'null')
  if (!value || typeof value !== 'object') throw new Error('Invalid brief draft')
  const draft = value as Record<string, unknown>
  for (const key of ['projectName', 'goal', 'brand', 'audienceAction', 'keyMessage', 'additionalContext', 'resolution']) {
    if (typeof draft[key] !== 'string') throw new Error('Invalid brief draft')
  }
  if (!['guided', 'plain'].includes(String(draft.briefMode))
    || (draft.brandId !== null && !Number.isSafeInteger(draft.brandId))
    || !Number.isSafeInteger(draft.conceptCount)) throw new Error('Invalid brief draft')
  for (const key of ['aspectRatios', 'mediaChannels']) {
    if (!Array.isArray(draft[key]) || !(draft[key] as unknown[]).every(item => typeof item === 'string')) throw new Error('Invalid brief draft')
  }
  for (const key of ['assetIds', 'styleGuideIds']) {
    if (draft[key] !== undefined && (!Array.isArray(draft[key]) || !(draft[key] as unknown[]).every(Number.isSafeInteger))) throw new Error('Invalid brief draft')
  }
  return draft as unknown as StudioBriefPayload
}

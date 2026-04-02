import type { StudioBriefPayload, StudioConcept } from '../../shared/types/studio'

const defaultBrief = (): StudioBriefPayload => ({
  brand: '',
  projectName: '',
  goal: 'Aumentar ventas',
  audienceAction: '',
  keyMessage: '',
  additionalContext: '',
  resolution: '1K rapido',
  conceptCount: 3,
  mediaChannels: ['Google Ads', 'Instagram Stories'],
  aspectRatios: ['1:1', '9:16']
})

export function useStudioSession() {
  const brief = useState<StudioBriefPayload>('studio-brief', defaultBrief)
  const concepts = useState<StudioConcept[]>('studio-concepts', () => [])

  return {
    brief,
    concepts
  }
}

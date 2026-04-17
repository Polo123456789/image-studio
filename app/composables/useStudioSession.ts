import type { StudioBriefPayload, StudioConcept, StudioProject } from '../../shared/types/studio'

const defaultBrief = (): StudioBriefPayload => ({
  brand: '',
  projectName: '',
  goal: 'Aumentar ventas',
  audienceAction: '',
  keyMessage: '',
  additionalContext: '',
  assetIds: [],
  styleGuideId: null,
  styleGuideNotes: '',
  creativeStyleId: null,
  resolution: '1K rapido',
  conceptCount: 3,
  mediaChannels: ['Google Ads', 'Instagram Stories'],
  aspectRatios: ['1:1', '9:16']
})

export function useStudioSession() {
  const projectSlug = useState<string>('studio-project-slug', () => '')
  const brief = useState<StudioBriefPayload>('studio-brief', defaultBrief)
  const concepts = useState<StudioConcept[]>('studio-concepts', () => [])
  const isGeneratingConcepts = useState<boolean>('studio-is-generating-concepts', () => false)
  const generationMessage = useState<string>('studio-generation-message', () => '')

  function setProject(project: StudioProject) {
    projectSlug.value = project.slug
    brief.value = project.brief
    concepts.value = project.concepts
  }

  function clearProject() {
    projectSlug.value = ''
    brief.value = defaultBrief()
    concepts.value = []
    isGeneratingConcepts.value = false
    generationMessage.value = ''
  }

  return {
    projectSlug,
    brief,
    concepts,
    isGeneratingConcepts,
    generationMessage,
    setProject,
    clearProject
  }
}

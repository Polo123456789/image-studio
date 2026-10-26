import type { StudioRegenerationTask } from '../utils/studio-regenerations'
import type { StudioBriefPayload, StudioConcept, StudioConfirmedReviewRatings, StudioProject } from '../../shared/types/studio'
import { studioReviewKey } from '../utils/studio-review'

const defaultBrief = (): StudioBriefPayload => ({
  briefMode: 'guided',
  brandId: null,
  brand: '',
  projectName: '',
  goal: 'Aumentar ventas',
  plainBrief: '',
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
  const regenerationTasks = useState<StudioRegenerationTask[]>('studio-regeneration-tasks', () => [])
  const projectSlug = useState<string>('studio-project-slug', () => '')
  const brief = useState<StudioBriefPayload>('studio-brief', defaultBrief)
  const concepts = useState<StudioConcept[]>('studio-concepts', () => [])
  const confirmedReviewRatings = useState<StudioConfirmedReviewRatings>('studio-confirmed-review-ratings', () => ({}))
  const isGeneratingConcepts = useState<boolean>('studio-is-generating-concepts', () => false)
  const generationMessage = useState<string>('studio-generation-message', () => '')

  function setProject(project: StudioProject) {
    // A fetched project is authoritative; all editor instances must share this baseline.
    confirmedReviewRatings.value = {
      ...confirmedReviewRatings.value,
      [project.slug]: Object.fromEntries(project.concepts.flatMap(concept => concept.formats.flatMap(format =>
        format.variants.map(variant => [studioReviewKey(concept.id, format.ratio, variant.id), variant.reviewRating ?? null])
      )))
    }
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
    regenerationTasks,
    projectSlug,
    brief,
    concepts,
    confirmedReviewRatings,
    isGeneratingConcepts,
    generationMessage,
    setProject,
    clearProject
  }
}

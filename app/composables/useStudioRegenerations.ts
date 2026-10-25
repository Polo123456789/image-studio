import type { StudioConceptMutationResponse } from '../../shared/types/studio'
import { createRegenerationRunner } from '../utils/studio-regenerations'
export function useStudioRegenerations() {
  const { regenerationTasks } = useStudioSession()
  const runner = createRegenerationRunner(regenerationTasks, request => $fetch<StudioConceptMutationResponse>('/api/studio/regenerate-variant', { method: 'POST', body: request }))
  return { regenerationTasks, runRegeneration: runner.run }
}

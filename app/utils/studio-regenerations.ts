import type { Ref } from 'vue'
import type { StudioConceptMutationResponse, StudioRegenerateVariantPayload } from '../../shared/types/studio'
import { getRequestErrorMessage } from './http-errors'

export interface StudioRegenerationTask {
  id: string
  request: StudioRegenerateVariantPayload
  projectName: string
  conceptTitle: string
  status: 'running' | 'ready' | 'error'
  startedAt: string
  variantId?: string
  thumbnailUrl?: string
  error?: string
  operation?: 'formats' | 'final' | 'concepts'
  summary?: string
}

export function regenerationLocation(task: StudioRegenerationTask, retry = false) {
  return {
    path: `/studio/${encodeURIComponent(task.request.projectSlug)}/concepts`,
    query: {
      concept: task.request.conceptId,
      ratio: task.request.ratio,
      ...(task.variantId || task.request.sourceVariantId ? { variant: task.variantId || task.request.sourceVariantId } : {}),
      taskFocus: `${task.id}-${Date.now()}`,
      ...(retry ? { retryRegeneration: task.id } : {})
    }
  }
}

export function createRegenerationRunner(
  tasks: Ref<StudioRegenerationTask[]>,
  fetcher: (request: StudioRegenerateVariantPayload) => Promise<StudioConceptMutationResponse>
) {
  async function run(request: StudioRegenerateVariantPayload, projectName: string, conceptTitle: string, retryId?: string) {
    if (tasks.value.some(task => task.status === 'running' && task.request.projectSlug === request.projectSlug && task.request.conceptId === request.conceptId)) {
      throw new Error('Este concepto ya se está regenerando.')
    }
    const id = retryId || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const task: StudioRegenerationTask = { id, request: { ...request }, projectName, conceptTitle, status: 'running', startedAt: new Date().toISOString() }
    tasks.value = [task, ...tasks.value.filter(item => item.id !== id)]
    function patch(update: Partial<StudioRegenerationTask>) {
      tasks.value = tasks.value.map(item => item.id === id ? { ...item, ...update } : item)
    }
    try {
      const response = await fetcher(request)
      const format = response.concept.formats.find(item => item.ratio === request.ratio)
      const variant = format?.variants.find(item => item.id === format.activeVariantId)
      if (format?.generationError || !variant?.imageUrl || variant.id === request.sourceVariantId) {
        throw new Error(format?.generationError || 'No se pudo generar una nueva versión.')
      }
      patch({ status: 'ready', variantId: variant.id, thumbnailUrl: variant.thumbnailUrl || variant.imageUrl })
      return response
    } catch (error) {
      patch({ status: 'error', error: getRequestErrorMessage(error, 'No se pudo regenerar la imagen.') })
      throw error
    }
  }
  return { run }
}

export async function trackStudioGeneration<T>(
  tasks: Ref<StudioRegenerationTask[]>,
  request: StudioRegenerateVariantPayload,
  projectName: string,
  conceptTitle: string,
  operation: NonNullable<StudioRegenerationTask['operation']>,
  execute: () => Promise<T>,
  summarize: (response: T) => { summary: string; request?: StudioRegenerateVariantPayload; error?: string; variantId?: string; thumbnailUrl?: string }
): Promise<T> {
  const id = globalThis.crypto.randomUUID()
  tasks.value = [{ id, request: { ...request }, projectName, conceptTitle, operation, status: 'running', startedAt: new Date().toISOString() }, ...tasks.value]
  const patch = (update: Partial<StudioRegenerationTask>) => { tasks.value = tasks.value.map(task => task.id === id ? { ...task, ...update } : task) }
  try {
    const response = await execute()
    const result = summarize(response)
    patch({ ...result, request: result.request ? { ...result.request, projectSlug: request.projectSlug } : { ...request }, status: result.error ? 'error' : 'ready' })
    return response
  } catch (error) {
    patch({ status: 'error', error: getRequestErrorMessage(error, 'No se pudo completar la generación.') })
    throw error
  }
}

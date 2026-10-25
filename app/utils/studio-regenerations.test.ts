import { expect, test } from 'bun:test'
import { ref } from 'vue'
import { createRegenerationRunner, regenerationLocation, type StudioRegenerationTask } from './studio-regenerations'
import type { StudioConceptMutationResponse, StudioRegenerateVariantPayload } from '../../shared/types/studio'
const request: StudioRegenerateVariantPayload = { projectSlug: 'project', conceptId: 'concept', ratio: '9:16', sourceVariantId: 'old', prompt: 'historical prompt', fromReview: true }
function result(error: string | null = null): StudioConceptMutationResponse {
  return { concept: { id: 'concept', title: 'Concept', subtitle: '', rationale: '', selectedRatio: '9:16', approvedAt: null, formats: [{ ratio: '9:16', isPreviewSource: false, promptDraft: '', generationError: error, activeVariantId: 'new', variants: [{ id: 'new', label: 'new', mode: 'preview', prompt: '', imageUrl: '/new.jpg', thumbnailUrl: '/thumb.jpg', createdAt: new Date().toISOString() }] }] } }
}
test('running row points to source and ready row points to the exact result', async () => {
  const tasks = ref<StudioRegenerationTask[]>([])
  let release!: (value: StudioConceptMutationResponse) => void
  const runner = createRegenerationRunner(tasks, () => new Promise(resolve => { release = resolve }))
  const pending = runner.run(request, 'Project', 'Concept')
  expect(tasks.value[0]!.status).toBe('running')
  expect(regenerationLocation(tasks.value[0]!).query.variant).toBe('old')
  await expect(runner.run(request, 'Project', 'Concept')).rejects.toThrow('ya se está regenerando')
  release(result())
  await pending
  expect(tasks.value[0]!.status).toBe('ready')
  expect(regenerationLocation(tasks.value[0]!).query.variant).toBe('new')
  expect(tasks.value[0]!.thumbnailUrl).toBe('/thumb.jpg')
})
test('HTTP200 generation failure is an error and retry keeps original payload and task id', async () => {
  const tasks = ref<StudioRegenerationTask[]>([])
  const received: StudioRegenerateVariantPayload[] = []
  let fail = true
  const runner = createRegenerationRunner(tasks, async payload => { received.push(payload); return result(fail ? 'Gemini failed' : null) })
  await expect(runner.run(request, 'Project', 'Concept')).rejects.toThrow('Gemini failed')
  const task = tasks.value[0]!
  expect(task.status).toBe('error')
  expect(regenerationLocation(task, true).query.retryRegeneration).toBe(task.id)
  fail = false
  await runner.run(task.request, task.projectName, task.conceptTitle, task.id)
  expect(tasks.value).toHaveLength(1)
  expect(tasks.value[0]!.status).toBe('ready')
  expect(received[1]).toEqual(request)
})
test('network failure leaves a retryable task and permits independent concepts', async () => {
  const tasks = ref<StudioRegenerationTask[]>([])
  const runner = createRegenerationRunner(tasks, async () => { throw new Error('Offline') })
  await expect(runner.run(request, 'Project', 'Concept')).rejects.toThrow()
  await expect(runner.run({ ...request, conceptId: 'another' }, 'Project', 'Another')).rejects.toThrow()
  expect(tasks.value).toHaveLength(2)
  expect(tasks.value.every(task => task.status === 'error' && task.error === 'Offline')).toBe(true)
})

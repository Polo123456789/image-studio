import { expect, test } from 'bun:test'
import { parseStudioDraft } from './studio-draft'
import { buildStudioBriefPayload, createStudioBriefFormState } from './studio-brief'

test('a local draft preserves references, output and brief content', () => {
  const form = { ...createStudioBriefFormState(), projectName: 'Campaña', brandId: 2, plainBrief: 'Brief completo', briefMode: 'plain' as const }
  const draft = buildStudioBriefPayload(form, ['Instagram Feed'], ['4:5'], 9, [4, 7], 'Marca')
  expect(parseStudioDraft(JSON.stringify(draft))).toEqual(draft)
})

test('invalid local storage cannot inject malformed array selections into the form', () => {
  const draft = buildStudioBriefPayload(createStudioBriefFormState(), ['Instagram Feed'], ['1:1'], null)
  for (const raw of [null, '{', 'null', '[]', JSON.stringify({ ...draft, aspectRatios: [null] }), JSON.stringify({ ...draft, assetIds: 'not-an-array' })]) {
    expect(() => parseStudioDraft(raw)).toThrow()
  }
})

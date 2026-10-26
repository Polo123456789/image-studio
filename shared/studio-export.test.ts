import { expect, test } from 'bun:test'
import type { StudioConcept, StudioReviewRating } from './types/studio'
import { selectStudioExportImages } from './studio-export'

function concept(id: string, ratings: StudioReviewRating[]): StudioConcept {
  return {
    id, title: id, subtitle: '', rationale: '', selectedRatio: '1:1', approvedAt: null,
    formats: ratings.map((reviewRating, index) => ({
      ratio: String(index), isPreviewSource: false, promptDraft: '', generationError: null, activeVariantId: 'active',
      variants: [
        { id: 'old', label: 'Anterior', mode: 'final', prompt: '', imageUrl: '/old.png', thumbnailUrl: null, createdAt: '', reviewRating },
        { id: 'active', label: 'Activa', mode: 'final', prompt: '', imageUrl: `/${id}-${index}.png`, thumbnailUrl: null, createdAt: '', reviewRating }
      ]
    }))
  }
}
const ids = (concepts: StudioConcept[], scope: 'good' | 'mixed' | 'all' = 'good') =>
  selectStudioExportImages(concepts, scope).map(image => image.variant.imageUrl)

test('defaults to good active images, including good images from mixed concepts', () => {
  expect(ids([concept('good', ['good']), concept('mixed', ['good', 'bad', null]), concept('bad', ['bad'])]))
    .toEqual(['/good-0.png', '/mixed-0.png'])
})
test('mixed export includes bad and unreviewed active images in mixed concepts, excluding all-bad concepts', () => {
  expect(ids([concept('good', ['good']), concept('mixed', ['good', 'bad', null]), concept('pending', [null]), concept('bad', ['bad'])], 'mixed'))
    .toEqual(['/good-0.png', '/mixed-0.png', '/mixed-1.png', '/mixed-2.png', '/pending-0.png'])
})
test('all exports active final images without historical versions', () => {
  expect(ids([concept('good', ['good']), concept('bad', ['bad']), concept('pending', [null])], 'all'))
    .toEqual(['/good-0.png', '/bad-0.png', '/pending-0.png'])
})
test('when active images are unreviewed, defaults to all even if historical versions have ratings', () => {
  const concepts = [concept('one', [null]), concept('two', [null])]
  concepts[0]!.formats[0]!.variants[0]!.reviewRating = 'bad'
  concepts[1]!.formats[0]!.variants[0]!.reviewRating = 'good'
  expect(ids(concepts)).toEqual(['/one-0.png', '/two-0.png'])
  expect(ids(concepts, 'mixed')).toEqual(ids(concepts, 'all'))
})
test('mixed export follows the concept label while exporting only the active version', () => {
  const mixed = concept('mixed', ['bad'])
  mixed.formats[0]!.variants[0]!.reviewRating = 'good'
  expect(ids([mixed], 'mixed')).toEqual(['/mixed-0.png'])
  expect(ids([mixed])).toEqual([])
})
test('reviewed all-bad projects have an empty default export and remain available in all', () => {
  expect(ids([concept('bad', ['bad'])])).toEqual([])
  expect(ids([concept('bad', ['bad'])], 'mixed')).toEqual([])
  expect(ids([concept('bad', ['bad'])], 'all')).toEqual(['/bad-0.png'])
})
test('preview, empty and missing active versions are not exported', () => {
  const preview = concept('preview', ['good'])
  preview.formats[0]!.variants[1]!.mode = 'preview'
  const empty = concept('empty', ['good'])
  empty.formats[0]!.variants[1]!.imageUrl = ' '
  const missing = concept('missing', ['good'])
  missing.formats[0]!.activeVariantId = 'missing'
  expect(ids([preview, empty, missing], 'all')).toEqual([])
})

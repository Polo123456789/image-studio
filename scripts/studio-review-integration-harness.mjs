import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { createJiti } from 'jiti'
import Database from 'better-sqlite3'
import { createError } from 'h3'

if (!process.env.IMAGE_STUDIO_DB_PATH) throw new Error('An isolated database path is required')
globalThis.createError = createError
const sqlite = new Database(process.env.IMAGE_STUDIO_DB_PATH)
const files = readdirSync('server/db/migrations').filter(file => file.endsWith('.sql')).sort()
for (const file of files.slice(0, -1)) sqlite.exec(readFileSync(`server/db/migrations/${file}`, 'utf8'))
const brief = JSON.stringify({ projectName: 'Review', goal: 'Review', conceptCount: 1, mediaChannels: ['Instagram'], aspectRatios: ['1:1'] })
sqlite.prepare('INSERT INTO studio_projects (id, slug, project_name, brief, created_at, updated_at) VALUES (?, ?, ?, ?, 1000, 1000)').run(1, 'review', 'Review', brief)
sqlite.prepare('INSERT INTO studio_projects (id, slug, project_name, brief, created_at, updated_at) VALUES (?, ?, ?, ?, 1000, 1000)').run(2, 'other', 'Other', brief)
for (const [id, project, key] of [[1, 1, 'concept'], [2, 2, 'foreign'], [3, 1, 'discarded']]) {
  sqlite.prepare('INSERT INTO studio_concepts (id, project_id, concept_key, title, subtitle, rationale, position, discarded_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, 1000, 1000)').run(id, project, key, key, '', '', id === 3 ? 1000 : null)
  sqlite.prepare('INSERT INTO studio_concept_formats (id, concept_id, ratio, prompt_draft, active_variant_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1000, 1000)').run(id, id, '1:1', 'prompt', 'image')
  sqlite.prepare('INSERT INTO studio_variants (id, format_id, variant_key, label, mode, prompt, image_url, thumbnail_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1000)').run(id, id, 'image', 'Preview', 'preview', 'prompt', '/uploads/generated/originals/existing.jpg', '/uploads/generated/thumbnails/existing.webp')
}
// Apply the actual generated upgrade over existing images, not just a fresh schema.
sqlite.exec(readFileSync(`server/db/migrations/${files.at(-1)}`, 'utf8'))
assert.equal(sqlite.prepare('SELECT count(*) AS n FROM studio_variants').get().n, 3)
assert.equal(sqlite.prepare('SELECT review_rating FROM studio_variants WHERE id = 1').get().review_rating, null)
assert.equal(sqlite.prepare('SELECT image_url FROM studio_variants WHERE id = 1').get().image_url, '/uploads/generated/originals/existing.jpg')
sqlite.close()

const jiti = createJiti(import.meta.url, { interopDefault: true })
const repository = jiti('../server/utils/studio/repository.ts')
const payload = { conceptId: 'concept', ratio: '1:1', variantId: 'image', rating: 'bad' }
assert.deepEqual(repository.reviewStudioVariant('review', payload), { rating: 'bad' })
let concept = repository.getStudioConceptById('review', 'concept')
assert.equal(concept.formats[0].variants[0].reviewRating, 'bad')
assert.equal(concept.formats[0].activeVariantId, 'image')
assert.equal(concept.approvedAt, null)
assert.throws(() => repository.reviewStudioVariant('other', payload))
assert.throws(() => repository.reviewStudioVariant('review', { ...payload, conceptId: 'foreign' }))
assert.throws(() => repository.reviewStudioVariant('review', { ...payload, conceptId: 'discarded' }))
assert.throws(() => repository.reviewStudioVariant('review', { ...payload, ratio: '9:16' }))
assert.throws(() => repository.reviewStudioVariant('review', { ...payload, variantId: 'missing' }))
concept = repository.addStudioConceptVariant('review', 'concept', '1:1', 'preview', 'prompt nuevo', {
  imageUrl: '/uploads/generated/originals/new.jpg', thumbnailUrl: '/uploads/generated/thumbnails/new.webp'
})
assert.equal(concept.formats[0].variants.find(item => item.id === 'image').reviewRating, 'bad')
assert.equal(concept.formats[0].variants.find(item => item.id !== 'image').reviewRating, null)
const generatedId = concept.formats[0].activeVariantId
repository.reviewStudioVariant('review', { ...payload, rating: null })
concept = repository.getStudioConceptById('review', 'concept')
assert.equal(concept.formats[0].variants.find(item => item.id === 'image').reviewRating, null)
assert.equal(concept.formats[0].activeVariantId, generatedId)
console.log('Review migration, persistence, project scoping, undo and regeneration: OK')

import { afterEach, describe, expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { Database } from 'bun:sqlite'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

describe('library SQL pagination', () => {
  test('pagina con orden estable y conserva busqueda/colecciones historicas', async () => {
    const root = await mkdtemp(join(tmpdir(), 'image-studio-library-test-'))
    temporaryDirectories.push(root)
    const databasePath = join(root, 'local.db')
    const sqlite = new Database(databasePath)
    sqlite.exec(`
      create table studio_projects (id integer primary key, slug text, project_name text, brief text, created_at integer, updated_at integer);
      create table studio_concepts (id integer primary key, project_id integer, concept_key text, title text, subtitle text, rationale text, creative_style_id integer, creative_style_name text, approved_at integer, position integer, discarded_at integer, created_at integer, updated_at integer);
      create table studio_concept_formats (id integer primary key, concept_id integer, ratio text, is_preview_source integer, prompt_draft text, active_variant_key text, created_at integer, updated_at integer);
      create table studio_variants (id integer primary key, format_id integer, variant_key text, label text, mode text, prompt text, image_url text, thumbnail_url text, image_mime_type text, image_file_size integer, image_width integer, image_height integer, image_hash text, created_at integer);
      insert into studio_projects values (1, 'proyecto', 'Proyecto', '{}', 1000, 1000);
    `)

    const insertConcept = sqlite.query('insert into studio_concepts values (?, 1, ?, ?, ?, ?, null, null, null, ?, null, 1000, 1000)')
    const insertFormat = sqlite.query('insert into studio_concept_formats values (?, ?, ?, 0, ?, ?, 1000, 1000)')
    const insertVariant = sqlite.query('insert into studio_variants values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1000)')
    const seed = sqlite.transaction(() => {
      for (let id = 1; id <= 45; id += 1) {
        insertConcept.run(id, `concepto-${id}`, `Concepto ${id}`, 'Subtitulo', 'Rationale', id)
        insertFormat.run(id, id, '1:1', '', `final-${id}`)
        insertVariant.run(100 + id, id, `final-${id}`, 'Final', 'final', 'prompt final', `/uploads/generated/originals/${id}.png`, `/uploads/generated/thumbnails/${id}.webp`, 'image/png', 10, 1, 1, `hash-${id}`)
      }
      insertVariant.run(1, 1, 'preview-1', 'Preview', 'preview', 'aguja historica', '/uploads/generated/originals/preview.png', '/uploads/generated/thumbnails/preview.webp', 'image/png', 10, 1, 1, 'preview-hash')
    })
    seed()
    sqlite.close()

    const resultPath = join(root, 'result.json')
    execFileSync('node', [resolve('scripts/library-integration-harness.mjs')], {
      cwd: resolve('.'),
      env: { ...process.env, IMAGE_STUDIO_DB_PATH: databasePath, TEST_RESULT_PATH: resultPath },
      encoding: 'utf8'
    })
    const result = JSON.parse(await readFile(resultPath, 'utf8')) as {
      firstIds: string[]
      secondIds: string[]
      totalImages: number
      totalVersions: number
      folderImageCount: number
      ratioImageCount: number
      promptSearchIds: string[]
      legacyIds: string[]
      historicalCollectionKeys: string[]
      detailVersionCount: number
    }

    expect(result.firstIds).toHaveLength(40)
    expect(result.secondIds).toHaveLength(5)
    expect(new Set([...result.firstIds, ...result.secondIds]).size).toBe(45)
    expect(result.totalImages).toBe(45)
    expect(result.totalVersions).toBe(46)
    expect(result.folderImageCount).toBe(45)
    expect(result.ratioImageCount).toBe(45)
    expect(result.promptSearchIds).toEqual(['1'])
    expect(result.legacyIds).toEqual(['1'])
    expect(result.historicalCollectionKeys).toContain('previews-legado')
    expect(result.detailVersionCount).toBe(2)
  })
})

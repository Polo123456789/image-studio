import { afterEach, describe, expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { Database } from 'bun:sqlite'
import sharp from 'sharp'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

describe('backup v2', () => {
  test('valida referencias, rechaza archivos corruptos y restaura sin reemplazar el mount point', async () => {
    const root = await mkdtemp(join(tmpdir(), 'image-studio-backup-test-'))
    temporaryDirectories.push(root)
    const databasePath = join(root, 'local.db')
    const uploadsRoot = join(root, 'uploads')
    const original = await sharp({ create: { width: 4, height: 3, channels: 4, background: '#2255aa' } }).png().toBuffer()
    const thumbnail = await sharp(original).webp().toBuffer()
    const asset = Buffer.from('asset-png-bytes')
    const reference = Buffer.from('reference-jpeg-bytes')

    await Promise.all([
      mkdir(join(uploadsRoot, 'generated', 'originals', 'aa'), { recursive: true }),
      mkdir(join(uploadsRoot, 'generated', 'thumbnails', 'aa'), { recursive: true }),
      mkdir(join(uploadsRoot, 'assets'), { recursive: true }),
      mkdir(join(uploadsRoot, 'creative-styles'), { recursive: true })
    ])
    await Promise.all([
      writeFile(join(uploadsRoot, 'generated', 'originals', 'aa', 'original.png'), original),
      writeFile(join(uploadsRoot, 'generated', 'thumbnails', 'aa', 'thumb.webp'), thumbnail),
      writeFile(join(uploadsRoot, 'assets', 'asset.png'), asset),
      writeFile(join(uploadsRoot, 'creative-styles', 'reference..jpg'), reference)
    ])

    execFileSync('bun', ['run', 'db:migrate'], {
      cwd: resolve('.'),
      env: { ...process.env, IMAGE_STUDIO_DB_PATH: databasePath },
      encoding: 'utf8'
    })
    const sqlite = new Database(databasePath)
    sqlite.query("insert into studio_projects values (1, 'proyecto', 'Original', '{}', 1, 1)").run()
    sqlite.query("insert into assets values (1, 'Asset', 'asset.png', '/uploads/assets/asset.png', 'image/png', ?, ?, '', '[]', null, 1, 1)")
      .run(asset.length, createHash('sha256').update(asset).digest('hex'))
    sqlite.query("insert into creative_styles values (1, 'Estilo', '', '/uploads/creative-styles/reference..jpg', 0, 1, 1, 1)").run()
    sqlite.query(`
      insert into studio_concepts (
        id, project_id, concept_key, title, subtitle, rationale, approved_at,
        position, discarded_at, created_at, updated_at, creative_style_id, creative_style_name
      ) values (1, 1, 'concepto', 'Concepto', '', '', null, 0, null, 1, 1, null, null)
    `).run()
    sqlite.query("insert into studio_concept_formats values (1, 1, '1:1', 0, '', 'v1', 1, 1)").run()
    sqlite.query(`
      insert into studio_variants (
        id, format_id, variant_key, label, mode, prompt, image_url, created_at,
        thumbnail_url, image_mime_type, image_file_size, image_width, image_height, image_hash
      ) values (1, 1, 'v1', 'V1', 'final', '', '/uploads/generated/originals/aa/original.png', 1,
        '/uploads/generated/thumbnails/aa/thumb.webp', 'image/png', ?, 4, 3, ?)
    `)
      .run(original.length, createHash('sha256').update(original).digest('hex'))
    sqlite.close()

    const resultPath = join(root, 'result.json')
    execFileSync('node', [resolve('scripts/backup-integration-harness.mjs')], {
      cwd: resolve('.'),
      env: {
        ...process.env,
        IMAGE_STUDIO_DB_PATH: databasePath,
        IMAGE_STUDIO_UPLOADS_ROOT: uploadsRoot,
        TEST_RESULT_PATH: resultPath
      },
      encoding: 'utf8'
    })
    const result = JSON.parse(await readFile(resultPath, 'utf8')) as Record<string, unknown>

    expect(result).toEqual({
      missingFileRejected: true,
      corruptImportRejected: true,
      projectName: 'Original',
      rootMountPointPreserved: true,
      originalRestored: true,
      maintenanceReleased: true
    })
  })
})

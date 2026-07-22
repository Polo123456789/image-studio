import { afterEach, describe, expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { Database } from 'bun:sqlite'
import sharp from 'sharp'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

async function runProductionMigrator(root: string, confirmation: 'SI' | 'NO') {
  const resultPath = join(root, `result-${confirmation}.json`)
  execFileSync('node', [resolve('scripts/migrate-production-harness.mjs')], {
    cwd: resolve('.'),
    env: {
      ...process.env,
      TEST_DATABASE_PATH: join(root, 'local.db'),
      TEST_UPLOADS_PATH: join(root, 'uploads'),
      TEST_BACKUP_ROOT: join(root, 'backups'),
      TEST_CONFIRMATION: confirmation,
      TEST_RESULT_PATH: resultPath
    },
    encoding: 'utf8'
  })
  return JSON.parse(await readFile(resultPath, 'utf8')) as {
    cancelled: boolean,
    variants?: number,
    backupPath?: string
  }
}

describe('migrate-production', () => {
  test('cancela sin cambios y ejecuta el flujo completo tras la confirmacion', async () => {
    const root = await mkdtemp(join(tmpdir(), 'image-studio-production-migration-'))
    temporaryDirectories.push(root)
    const databasePath = join(root, 'local.db')
    const uploadsPath = join(root, 'uploads')
    const asset = Buffer.from('asset-existente')
    const jpeg = await sharp({ create: { width: 12, height: 8, channels: 3, background: '#cc2244' } }).jpeg().toBuffer()
    const png = await sharp({ create: { width: 7, height: 11, channels: 4, background: '#22cc88' } }).png().toBuffer()

    await mkdir(join(uploadsPath, 'assets'), { recursive: true })
    await writeFile(join(uploadsPath, 'assets', 'existing.png'), asset)
    execFileSync('bun', ['run', 'db:migrate'], {
      cwd: resolve('.'),
      env: { ...process.env, IMAGE_STUDIO_DB_PATH: databasePath },
      encoding: 'utf8'
    })

    const sqlite = new Database(databasePath)
    sqlite.query("insert into studio_projects values (1, 'proyecto', 'Proyecto', '{}', 1, 1)").run()
    sqlite.query(`
      insert into studio_concepts (
        id, project_id, concept_key, title, subtitle, rationale, approved_at,
        position, discarded_at, created_at, updated_at, creative_style_id, creative_style_name
      ) values (1, 1, 'concepto', 'Concepto', '', '', null, 0, null, 1, 1, null, null)
    `).run()
    sqlite.query("insert into studio_concept_formats values (1, 1, '1:1', 0, '', 'v1', 1, 1)").run()
    sqlite.query("insert into studio_concept_formats values (2, 1, '4:5', 0, '', 'v2', 1, 1)").run()
    sqlite.query(`
      insert into studio_variants (id, format_id, variant_key, label, mode, prompt, image_url, created_at)
      values (?, ?, ?, ?, 'final', '', ?, 1)
    `).run(1, 1, 'v1', 'JPEG', `data:image/jpeg;base64,${jpeg.toString('base64')}`)
    sqlite.query(`
      insert into studio_variants (id, format_id, variant_key, label, mode, prompt, image_url, created_at)
      values (?, ?, ?, ?, 'final', '', ?, 1)
    `).run(2, 2, 'v2', 'PNG', `data:image/png;base64,${png.toString('base64')}`)
    sqlite.close()

    const cancelled = await runProductionMigrator(root, 'NO')
    expect(cancelled).toEqual({ cancelled: true })
    expect(await stat(join(root, 'backups')).catch(() => null)).toBeNull()

    const migrated = await runProductionMigrator(root, 'SI')
    expect(migrated.cancelled).toBe(false)
    expect(migrated.variants).toBe(2)

    const backupDirectories = await readdir(join(root, 'backups'))
    expect(backupDirectories).toHaveLength(1)
    const backupPath = join(root, 'backups', backupDirectories[0]!)
    const manifest = JSON.parse(await readFile(join(backupPath, 'manifest.json'), 'utf8')) as {
      database: { inlineVariants: number },
      uploads: Array<{ path: string, sha256: string }>
    }
    expect(manifest.database.inlineVariants).toBe(2)
    expect(manifest.uploads).toEqual([{
      path: 'assets/existing.png',
      sha256: createHash('sha256').update(asset).digest('hex'),
      size: asset.length
    }])
    expect(await readFile(join(backupPath, 'uploads', 'assets', 'existing.png'))).toEqual(asset)

    const backupSqlite = new Database(join(backupPath, 'local.db'), { readonly: true })
    expect(backupSqlite.query("select count(*) as count from studio_variants where image_url like 'data:%'").get())
      .toEqual({ count: 2 })
    backupSqlite.close()

    const migratedSqlite = new Database(databasePath, { readonly: true })
    const rows = migratedSqlite.query(`
      select image_url, thumbnail_url, image_mime_type, image_hash
      from studio_variants order by id
    `).all() as Array<Record<string, string>>
    expect(migratedSqlite.query("select count(*) as count from studio_variants where image_url like 'data:%'").get())
      .toEqual({ count: 0 })
    expect(migratedSqlite.query('pragma quick_check').get()).toEqual({ quick_check: 'ok' })
    migratedSqlite.close()

    expect(rows.map(row => row.image_mime_type)).toEqual(['image/jpeg', 'image/png'])
    for (const [index, original] of [jpeg, png].entries()) {
      const row = rows[index]!
      const storedOriginal = await readFile(join(uploadsPath, row.image_url.replace('/uploads/', '')))
      expect(createHash('sha256').update(storedOriginal).digest('hex')).toBe(row.image_hash)
      expect(createHash('sha256').update(storedOriginal).digest('hex'))
        .toBe(createHash('sha256').update(original).digest('hex'))
      expect((await sharp(join(uploadsPath, row.thumbnail_url.replace('/uploads/', ''))).metadata()).format).toBe('webp')
    }
    expect(await stat(`${databasePath}.migration.lock`).catch(() => null)).toBeNull()
  })
})

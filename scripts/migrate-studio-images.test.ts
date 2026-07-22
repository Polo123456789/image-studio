import { afterEach, describe, expect, test } from 'bun:test'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

import sharp from 'sharp'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

function runSql(databasePath: string, sql: string) {
  return execFileSync('sqlite3', [databasePath], { input: sql, encoding: 'utf8' })
}

function readJson(databasePath: string, sql: string) {
  return execFileSync('sqlite3', ['-json', databasePath, sql], { encoding: 'utf8' })
}

function migratorArguments(root: string, verify = false, maxRows?: number) {
  const args = [
    resolve('scripts/migrate-studio-images.mjs'),
    `--db=${resolve(root, 'local.db')}`,
    `--uploads=${resolve(root, 'public/uploads')}`,
    '--batch=1'
  ]
  if (verify) args.push('--verify')
  if (maxRows) args.push(`--max=${maxRows}`)
  return args
}

function runMigrator(root: string, verify = false, maxRows?: number) {
  const args = migratorArguments(root, verify, maxRows)
  return execFileSync('node', args, { encoding: 'utf8' })
}

function runMigratorExpectingFailure(root: string, maxRows?: number) {
  return spawnSync('node', migratorArguments(root, false, maxRows), { encoding: 'utf8' })
}

describe('migrate-studio-images', () => {
  test('preserva JPEG y PNG, crea thumbnails y se puede reanudar', async () => {
    const root = await mkdtemp(resolve(tmpdir(), 'image-studio-migrator-test-'))
    temporaryDirectories.push(root)
    const databasePath = resolve(root, 'local.db')
    const jpeg = await sharp({ create: { width: 12, height: 8, channels: 3, background: '#cc2244' } }).jpeg().toBuffer()
    const png = await sharp({ create: { width: 7, height: 11, channels: 4, background: '#22cc88' } }).png().toBuffer()

    runSql(databasePath, `
      create table studio_variants (
        id integer primary key, image_url text not null, thumbnail_url text,
        image_mime_type text, image_file_size integer, image_width integer,
        image_height integer, image_hash text
      );
      insert into studio_variants(id, image_url) values
        (1, 'data:image/png;base64,${jpeg.toString('base64')}'),
        (2, 'data:image/jpeg;base64,${png.toString('base64')}');
    `)

    expect(runMigratorExpectingFailure(root, 1).status).not.toBe(0)
    expect(runSql(databasePath, "select count(*) from studio_variants where image_url like 'data:%';").trim()).toBe('1')
    runMigrator(root)
    runMigrator(root, true)

    const rows = JSON.parse(readJson(databasePath, 'select * from studio_variants order by id;')) as Array<Record<string, string | number>>

    expect(rows[0]?.image_mime_type).toBe('image/jpeg')
    expect(String(rows[0]?.image_url)).toEndWith('.jpg')
    expect(rows[1]?.image_mime_type).toBe('image/png')
    expect(String(rows[1]?.image_url)).toEndWith('.png')

    for (const [index, original] of [jpeg, png].entries()) {
      const row = rows[index]!
      const stored = await readFile(resolve(root, 'public', String(row.image_url).slice(1)))
      expect(createHash('sha256').update(stored).digest('hex')).toBe(createHash('sha256').update(original).digest('hex'))
      const thumbnail = await sharp(resolve(root, 'public', String(row.thumbnail_url).slice(1))).metadata()
      expect(thumbnail.format).toBe('webp')
      expect(thumbnail.width).toBeLessThanOrEqual(512)
      expect(thumbnail.height).toBeLessThanOrEqual(512)
    }
  })

  test('no modifica una fila cuya imagen inline es invalida', async () => {
    const root = await mkdtemp(resolve(tmpdir(), 'image-studio-migrator-invalid-'))
    temporaryDirectories.push(root)
    const databasePath = resolve(root, 'local.db')
    runSql(databasePath, `
      create table studio_variants (
        id integer primary key, image_url text not null, thumbnail_url text,
        image_mime_type text, image_file_size integer, image_width integer,
        image_height integer, image_hash text
      );
      insert into studio_variants(id, image_url) values (1, 'data:image/jpeg;base64,bm8taW1hZ2U=');
    `)

    expect(runMigratorExpectingFailure(root).status).not.toBe(0)
    expect(runSql(databasePath, 'select image_url from studio_variants where id = 1;').trim())
      .toBe('data:image/jpeg;base64,bm8taW1hZ2U=')
  })
})

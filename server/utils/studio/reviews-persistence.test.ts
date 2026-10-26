import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

test('migrates existing images and persists scoped version reviews without changing generation state', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'studio-review-'))
  try {
    const output = execFileSync('node', [resolve('scripts/studio-review-integration-harness.mjs')], {
      cwd: resolve('.'), env: { ...process.env, IMAGE_STUDIO_DB_PATH: join(directory, 'review.db') }, encoding: 'utf8'
    })
    expect(output).toContain('Review migration, persistence, project scoping, undo and regeneration: OK')
    expect(output).toContain('Bulk cleanup validation, atomicity, stale reviews, project scoping and retained images: OK')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

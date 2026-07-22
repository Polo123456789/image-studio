import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { resolvePathInsideDirectory } from './storage-paths'

describe('rutas de uploads', () => {
  test('resuelve nombres validos dentro del directorio, incluso si contienen dos puntos', () => {
    const directory = join(process.cwd(), 'custom-uploads', 'creative-styles')

    expect(resolvePathInsideDirectory(directory, 'a..b-reference.jpg'))
      .toBe(join(directory, 'a..b-reference.jpg'))
  })

  test('rechaza escapes fuera del directorio configurado', () => {
    const directory = join(process.cwd(), 'custom-uploads', 'creative-styles')

    expect(resolvePathInsideDirectory(directory, '../secret.jpg')).toBeNull()
    expect(resolvePathInsideDirectory(directory, directory)).toBeNull()
  })
})

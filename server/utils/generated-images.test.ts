import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import sharp from 'sharp'

let uploadsRoot = ''
let images: typeof import('./generated-images')
const previousUploadsRoot = process.env.IMAGE_STUDIO_UPLOADS_ROOT

beforeAll(async () => {
  uploadsRoot = await mkdtemp(join(tmpdir(), 'image-studio-generated-test-'))
  process.env.IMAGE_STUDIO_UPLOADS_ROOT = uploadsRoot
  Object.assign(globalThis, {
    createError: (input: { statusCode: number, statusMessage: string }) => Object.assign(new Error(input.statusMessage), input)
  })
  images = await import(`./generated-images.ts?test=${Date.now()}`) as typeof import('./generated-images')
})

afterAll(async () => {
  if (previousUploadsRoot === undefined) delete process.env.IMAGE_STUDIO_UPLOADS_ROOT
  else process.env.IMAGE_STUDIO_UPLOADS_ROOT = previousUploadsRoot
  await rm(uploadsRoot, { recursive: true, force: true })
})

describe('generated image storage', () => {
  for (const format of ['jpeg', 'png'] as const) {
    test(`preserva exactamente los bytes ${format.toUpperCase()} y solo usa WebP para thumbnail`, async () => {
      const pipeline = sharp({
        create: {
          width: 32,
          height: 20,
          channels: 4,
          background: { r: 18, g: 120, b: 210, alpha: 0.7 }
        }
      })
      const original = format === 'png' ? await pipeline.png().toBuffer() : await pipeline.jpeg().toBuffer()
      const stored = await images.storeStudioImage(original)
      const storedOriginal = await readFile(images.resolveGeneratedImagePath(stored.imageUrl))
      const thumbnail = await sharp(images.resolveGeneratedImagePath(stored.thumbnailUrl)).metadata()

      expect(storedOriginal.equals(original)).toBe(true)
      expect(stored.imageUrl.endsWith(format === 'png' ? '.png' : '.jpg')).toBe(true)
      expect(stored.imageMimeType).toBe(format === 'png' ? 'image/png' : 'image/jpeg')
      expect(thumbnail.format).toBe('webp')
      expect(thumbnail.width).toBeLessThanOrEqual(512)
      expect(thumbnail.height).toBeLessThanOrEqual(512)
    })
  }

  test('rechaza rutas que escapan del directorio generado', () => {
    expect(() => images.resolveGeneratedImagePath('/uploads/generated/../../local.db')).toThrow('Imagen no encontrada')
  })
})

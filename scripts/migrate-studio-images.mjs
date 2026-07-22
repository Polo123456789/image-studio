import { createHash, randomUUID } from 'node:crypto'
import { mkdir, open, readFile, rename, stat, unlink } from 'node:fs/promises'
import { dirname, relative, resolve, sep } from 'node:path'

import Database from 'better-sqlite3'
import sharp from 'sharp'

function readArgument(name, fallback) {
  const prefix = `--${name}=`
  const argument = process.argv.find(value => value.startsWith(prefix))
  return argument ? argument.slice(prefix.length) : fallback
}

const verifyOnly = process.argv.includes('--verify')
const databasePath = resolve(readArgument('db', 'server/db/local.db'))
const uploadsRoot = resolve(readArgument('uploads', 'public/uploads'))
const generatedRoot = resolve(uploadsRoot, 'generated')
const batchSize = Math.max(1, Math.min(100, Number(readArgument('batch', '10')) || 10))
const maxRows = Math.max(1, Number(readArgument('max', String(Number.MAX_SAFE_INTEGER))) || Number.MAX_SAFE_INTEGER)

function hashBuffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function parseDataUrl(value) {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match) throw new Error('data URL invalida')
  return Buffer.from(match[2], 'base64')
}

async function inspectImage(buffer) {
  const metadata = await sharp(buffer, { failOn: 'error' }).metadata()
  if (!metadata.width || !metadata.height || !['jpeg', 'png'].includes(metadata.format || '')) {
    throw new Error('solo se aceptan originales JPEG o PNG validos')
  }
  return {
    extension: metadata.format === 'png' ? '.png' : '.jpg',
    mimeType: metadata.format === 'png' ? 'image/png' : 'image/jpeg',
    width: metadata.width,
    height: metadata.height,
    hash: hashBuffer(buffer)
  }
}

async function exists(path) {
  try {
    await stat(path)
    return true
  }
  catch {
    return false
  }
}

async function writeAtomic(path, buffer) {
  await mkdir(dirname(path), { recursive: true })
  if (await exists(path)) return
  const temporaryPath = `${path}.${randomUUID()}.tmp`
  const handle = await open(temporaryPath, 'wx')
  try {
    await handle.writeFile(buffer)
    await handle.sync()
  }
  finally {
    await handle.close()
  }
  try {
    await rename(temporaryPath, path)
    const directoryHandle = await open(dirname(path), 'r')
    try {
      await directoryHandle.sync()
    }
    finally {
      await directoryHandle.close()
    }
  }
  catch (error) {
    await unlink(temporaryPath).catch(() => undefined)
    if (!await exists(path)) throw error
  }
}

function resolvePublicUrl(url) {
  const prefix = '/uploads/generated/'
  if (!url.startsWith(prefix)) throw new Error(`ruta no soportada: ${url}`)
  const path = resolve(generatedRoot, url.slice(prefix.length))
  const relativePath = relative(generatedRoot, path)
  if (!relativePath || relativePath.startsWith('..') || relativePath.includes(`..${sep}`)) {
    throw new Error(`ruta fuera del directorio generado: ${url}`)
  }
  return path
}

async function storeImage(buffer) {
  const image = await inspectImage(buffer)
  const shard = image.hash.slice(0, 2)
  const originalUrl = `/uploads/generated/originals/${shard}/${image.hash}${image.extension}`
  const thumbnailUrl = `/uploads/generated/thumbnails/${shard}/${image.hash}-v1.webp`
  const originalPath = resolvePublicUrl(originalUrl)
  const thumbnailPath = resolvePublicUrl(thumbnailUrl)

  await writeAtomic(originalPath, buffer)
  if (hashBuffer(await readFile(originalPath)) !== image.hash) throw new Error('hash de original incorrecto')

  if (!await exists(thumbnailPath)) {
    const thumbnail = await sharp(buffer, { failOn: 'error' })
      .rotate()
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer()
    await writeAtomic(thumbnailPath, thumbnail)
  }
  if ((await sharp(thumbnailPath, { failOn: 'error' }).metadata()).format !== 'webp') {
    throw new Error('thumbnail WebP invalido')
  }

  return {
    imageUrl: originalUrl,
    thumbnailUrl,
    mimeType: image.mimeType,
    fileSize: buffer.length,
    width: image.width,
    height: image.height,
    hash: image.hash
  }
}

function requireMigratedSchema(database) {
  const columns = new Set(database.prepare('pragma table_info(studio_variants)').all().map(row => row.name))
  for (const column of ['thumbnail_url', 'image_mime_type', 'image_file_size', 'image_width', 'image_height', 'image_hash']) {
    if (!columns.has(column)) throw new Error(`falta la migracion de esquema: ${column}`)
  }
}

async function migrate(database) {
  const update = database.prepare(`
    update studio_variants
    set image_url = ?, thumbnail_url = ?, image_mime_type = ?, image_file_size = ?,
        image_width = ?, image_height = ?, image_hash = ?
    where id = ? and image_url = ?
  `)
  let migrated = 0

  while (true) {
    const rows = database.prepare(`
      select id, image_url from studio_variants
      where image_url like 'data:%'
      order by id
      limit ?
    `).all(batchSize)
    if (!rows.length) break

    for (const row of rows) {
      try {
        const originalUrl = row.image_url
        const stored = await storeImage(parseDataUrl(originalUrl))
        const result = database.transaction(() => update.run(
          stored.imageUrl,
          stored.thumbnailUrl,
          stored.mimeType,
          stored.fileSize,
          stored.width,
          stored.height,
          stored.hash,
          row.id,
          originalUrl
        ))()
        if (result.changes !== 1) throw new Error('la fila cambio durante la migracion')
        migrated += 1
        console.log(`[migrate-images] ${migrated}: variante ${row.id} -> ${stored.imageUrl}`)
        if (migrated >= maxRows) return migrated
      }
      catch (error) {
        throw new Error(`variante ${row.id}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  return migrated
}

async function verify(database) {
  const rows = database.prepare(`
    select id, image_url, thumbnail_url, image_mime_type, image_file_size,
           image_width, image_height, image_hash
    from studio_variants order by id
  `).all()
  const failures = []

  for (const row of rows) {
    try {
      if (row.image_url.startsWith('data:')) throw new Error('continua inline')
      if (!row.thumbnail_url || !row.image_hash) throw new Error('faltan metadatos')
      const original = await readFile(resolvePublicUrl(row.image_url))
      const inspected = await inspectImage(original)
      if (inspected.hash !== row.image_hash) throw new Error('hash distinto')
      if (inspected.mimeType !== row.image_mime_type) throw new Error('MIME distinto')
      if (original.length !== row.image_file_size) throw new Error('tamano distinto')
      if (inspected.width !== row.image_width || inspected.height !== row.image_height) throw new Error('dimensiones distintas')
      const thumbnail = await sharp(resolvePublicUrl(row.thumbnail_url), { failOn: 'error' }).metadata()
      if (thumbnail.format !== 'webp' || (thumbnail.width || 0) > 512 || (thumbnail.height || 0) > 512) {
        throw new Error('thumbnail invalido')
      }
    }
    catch (error) {
      failures.push(`variante ${row.id}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const quickCheck = database.pragma('quick_check', { simple: true })
  const foreignKeyFailures = database.pragma('foreign_key_check')
  if (quickCheck !== 'ok') failures.push(`quick_check: ${quickCheck}`)
  if (foreignKeyFailures.length) failures.push(`${foreignKeyFailures.length} errores de foreign keys`)
  if (failures.length) throw new Error(failures.join('\n'))

  console.log(JSON.stringify({ verifiedVariants: rows.length, quickCheck, foreignKeyFailures: 0 }, null, 2))
}

const database = new Database(databasePath)
database.pragma('foreign_keys = on')

try {
  requireMigratedSchema(database)
  if (!verifyOnly) console.log(`[migrate-images] migradas: ${await migrate(database)}`)
  await verify(database)
}
finally {
  database.close()
}

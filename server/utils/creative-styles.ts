import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

import { asc, eq } from 'drizzle-orm'

import type {
  CreativeStyleInput,
  CreativeStyleRecord,
  CreativeStylesResponse
} from '../../shared/types/creative-styles'
import { db } from '../db/client'
import { creativeStyles } from '../db/schema'

const creativeStyleReferencesDirectory = resolve(process.cwd(), 'public/uploads/creative-styles')
const supportedCreativeStyleMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const defaultCreativeStyles = [
  {
    name: 'Packshot',
    description: 'Producto protagonista, fondo limpio, lectura comercial inmediata y foco total en forma, material y branding.'
  },
  {
    name: 'Estilo de vida',
    description: 'Producto integrado en una escena cotidiana aspiracional, con contexto humano o ambiental y atmosfera natural.'
  },
  {
    name: 'Macro y detalle',
    description: 'Encuadres cerrados para destacar textura, acabado, materialidad, gotas, brillos o pequeños rasgos diferenciales.'
  },
  {
    name: 'Flat Design',
    description: 'Lenguaje grafico plano, formas limpias, sombras minimas y composicion clara con lectura simple y moderna.'
  },
  {
    name: 'Ilustracion isometrica',
    description: 'Escena ilustrada en perspectiva isometrica, ordenada, tecnica y util para explicar producto, sistema o servicio.'
  },
  {
    name: 'Pop Art',
    description: 'Color vibrante, alto contraste, energia grafica, irreverencia visual y recursos expresivos muy notorios.'
  },
  {
    name: 'Minimalismo',
    description: 'Pocos elementos, mucho aire, composicion contenida, jerarquia clara y una direccion elegante y sobria.'
  },
  {
    name: 'Brutalismo',
    description: 'Impacto visual crudo, contrastes duros, composicion desafiante, tension grafica y presencia frontal.'
  },
  {
    name: 'Editorial',
    description: 'Direccion de arte inspirada en revistas premium, composicion refinada, ritmo visual y sensibilidad de moda.'
  },
  {
    name: 'Hero shot',
    description: 'Producto heroico y dominante, angulo dramatico, iluminacion protagonista y sensacion de lanzamiento o hito.'
  },
  {
    name: 'Flat lay',
    description: 'Vista cenital cuidadosamente ordenada, ideal para storytelling de accesorios, ingredientes o kits.'
  },
  {
    name: 'Bodegon contemporaneo',
    description: 'Naturaleza muerta publicitaria con props, balance escultorico y sensacion curada de estudio actual.'
  },
  {
    name: 'High key',
    description: 'Escena luminosa, clara y optimista, con sombras suaves y predominio de blancos o tonos muy livianos.'
  },
  {
    name: 'Low key cinematografico',
    description: 'Luz dramatica, fondos oscuros, profundidad atmosferica y una sensacion mas intensa o sofisticada.'
  },
  {
    name: 'Collage mixed media',
    description: 'Mezcla de fotografia, ilustracion, recortes y capas graficas para una pieza expresiva y menos literal.'
  },
  {
    name: 'Futurista 3D',
    description: 'Materiales digitales, volumen sintético, iluminacion artificial pulida y lenguaje visual de innovacion.'
  }
] as const

function toIsoString(value: Date) {
  return value.toISOString()
}

function slugifyFilePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function getCreativeStyleReferenceExtension(fileName: string, mimeType: string) {
  const existingExtension = extname(fileName).toLowerCase()

  if (existingExtension) {
    return existingExtension
  }

  if (mimeType === 'image/png') return '.png'
  if (mimeType === 'image/webp') return '.webp'
  if (mimeType === 'image/gif') return '.gif'

  return '.jpg'
}

function getCreativeStyleReferenceUrl(storedFileName: string) {
  return `/uploads/creative-styles/${storedFileName}`
}

function resolveCreativeStyleReferencePath(fileUrl: string) {
  return resolve(process.cwd(), 'public', fileUrl.replace(/^\//, ''))
}

function normalizeCreativeStyleRecord(record: typeof creativeStyles.$inferSelect): CreativeStyleRecord {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    referenceImageUrl: record.referenceImagePath,
    position: record.position,
    isActive: record.isActive,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt)
  }
}

function normalizeCreativeStyleInput(payload: CreativeStyleInput): CreativeStyleInput {
  return {
    name: payload.name.trim(),
    description: payload.description.trim(),
    position: typeof payload.position === 'number' && Number.isFinite(payload.position)
      ? Math.max(0, Math.floor(payload.position))
      : undefined,
    isActive: Boolean(payload.isActive)
  }
}

function ensureCreativeStyleName(name: string, existingId?: number) {
  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El nombre del estilo es obligatorio.'
    })
  }

  const existing = db.query.creativeStyles.findFirst({
    where: eq(creativeStyles.name, name)
  }).sync()

  if (existing && existing.id !== existingId) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ya existe un estilo creativo con ese nombre.'
    })
  }
}

function getCreativeStyleRowById(id: number) {
  const style = db.query.creativeStyles.findFirst({
    where: eq(creativeStyles.id, id)
  }).sync()

  if (!style) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Creative style not found'
    })
  }

  return style
}

function getNextCreativeStylePosition() {
  const rows = db.select({ position: creativeStyles.position })
    .from(creativeStyles)
    .orderBy(asc(creativeStyles.position), asc(creativeStyles.id))
    .all()

  return rows.length ? rows[rows.length - 1]!.position + 1 : 0
}

function ensureDefaultCreativeStyles() {
  const now = new Date()

  defaultCreativeStyles.forEach((style, index) => {
    db.insert(creativeStyles)
      .values({
        name: style.name,
        description: style.description,
        position: index,
        isActive: true,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoNothing({
        target: creativeStyles.name
      })
      .run()
  })
}

export function listCreativeStyles(): CreativeStylesResponse {
  ensureDefaultCreativeStyles()

  const rows = db.select()
    .from(creativeStyles)
    .orderBy(asc(creativeStyles.position), asc(creativeStyles.name), asc(creativeStyles.id))
    .all()

  return {
    styles: rows.map(normalizeCreativeStyleRecord)
  }
}

export function getActiveCreativeStyles() {
  ensureDefaultCreativeStyles()

  return db.select()
    .from(creativeStyles)
    .where(eq(creativeStyles.isActive, true))
    .orderBy(asc(creativeStyles.position), asc(creativeStyles.name), asc(creativeStyles.id))
    .all()
    .map(normalizeCreativeStyleRecord)
}

export function createCreativeStyle(payload: CreativeStyleInput) {
  const normalizedPayload = normalizeCreativeStyleInput(payload)

  ensureCreativeStyleName(normalizedPayload.name)

  const now = new Date()
  const result = db.insert(creativeStyles)
    .values({
      name: normalizedPayload.name,
      description: normalizedPayload.description,
      position: normalizedPayload.position ?? getNextCreativeStylePosition(),
      isActive: normalizedPayload.isActive,
      createdAt: now,
      updatedAt: now
    })
    .returning({ id: creativeStyles.id })
    .get()

  return normalizeCreativeStyleRecord(getCreativeStyleRowById(result.id))
}

export function updateCreativeStyle(id: number, payload: CreativeStyleInput) {
  const style = getCreativeStyleRowById(id)
  const normalizedPayload = normalizeCreativeStyleInput(payload)

  ensureCreativeStyleName(normalizedPayload.name, style.id)

  db.update(creativeStyles)
    .set({
      name: normalizedPayload.name,
      description: normalizedPayload.description,
      position: normalizedPayload.position ?? style.position,
      isActive: normalizedPayload.isActive,
      updatedAt: new Date()
    })
    .where(eq(creativeStyles.id, id))
    .run()

  return normalizeCreativeStyleRecord(getCreativeStyleRowById(id))
}

export async function deleteCreativeStyle(id: number) {
  const style = getCreativeStyleRowById(id)

  if (style.referenceImagePath) {
    try {
      await unlink(resolveCreativeStyleReferencePath(style.referenceImagePath))
    }
    catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
        throw error
      }
    }
  }

  db.delete(creativeStyles)
    .where(eq(creativeStyles.id, id))
    .run()
}

export async function uploadCreativeStyleReference(id: number, file: File) {
  const style = getCreativeStyleRowById(id)

  if (!file.size) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La imagen de referencia esta vacia.'
    })
  }

  if (!supportedCreativeStyleMimeTypes.has(file.type || '')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La referencia debe ser JPG, PNG, WEBP o GIF.'
    })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileNameBase = slugifyFilePart(style.name) || `style-${style.id}`
  const storedFileName = `${fileNameBase}-${randomUUID()}${getCreativeStyleReferenceExtension(file.name || style.name, file.type)}`
  const relativeFilePath = getCreativeStyleReferenceUrl(storedFileName)
  const absoluteFilePath = resolve(creativeStyleReferencesDirectory, storedFileName)

  await mkdir(creativeStyleReferencesDirectory, { recursive: true })
  await writeFile(absoluteFilePath, buffer)

  db.update(creativeStyles)
    .set({
      referenceImagePath: relativeFilePath,
      updatedAt: new Date()
    })
    .where(eq(creativeStyles.id, id))
    .run()

  if (style.referenceImagePath) {
    try {
      await unlink(resolveCreativeStyleReferencePath(style.referenceImagePath))
    }
    catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
        throw error
      }
    }
  }

  return normalizeCreativeStyleRecord(getCreativeStyleRowById(id))
}

export async function deleteCreativeStyleReference(id: number) {
  const style = getCreativeStyleRowById(id)

  if (!style.referenceImagePath) {
    return normalizeCreativeStyleRecord(style)
  }

  db.update(creativeStyles)
    .set({
      referenceImagePath: null,
      updatedAt: new Date()
    })
    .where(eq(creativeStyles.id, id))
    .run()

  try {
    await unlink(resolveCreativeStyleReferencePath(style.referenceImagePath))
  }
  catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
      throw error
    }
  }

  return normalizeCreativeStyleRecord(getCreativeStyleRowById(id))
}

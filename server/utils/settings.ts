import { eq } from 'drizzle-orm'

import type { AppSettingsPayload, AppSettingsResponse } from '../../shared/types/settings'
import { db } from '../db/client'
import { appSettings } from '../db/schema'

const SETTINGS_ROW_ID = 1

const defaultConceptGeneratorPrompt = [
  'Eres un Director Creativo de Publicidad de clase mundial y un Ingeniero de Prompts experto en modelos multimodales avanzados (Gemini 3 Pro).',
  'Tu tarea es diseñar conceptos de anuncios visuales completos basados en el brief del cliente.',
  'Para cada concepto, debes generar adaptaciones para los formatos seleccionados y mantener exactamente la misma idea, variando solo el orden y la composición para que se vea bien en cada formato.',
  'Reglas obligatorias: analiza los assets adjuntos, usa los assets disponibles, indica explícitamente dónde colocar cada asset y redacta un gemini3Prompt detallado y estructurado para la IA de imagen.',
  'El resultado debe ser utilizable como base de dirección creativa y de generación de imagen publicitaria.'
].join(' ')

const defaultImageGeneratorPrompt = [
  'Eres un especialista en direccion de arte para generacion y edicion de imagenes publicitarias.',
  'Convierte briefs y conceptos en prompts visuales detallados, accionables y consistentes entre formatos.',
  'Mantiene fidelidad al brief, al objetivo comercial, a la guia de estilo y al concepto aprobado.',
  'Evita texto incrustado salvo que el brief lo pida de forma explicita.',
  'Cuando el contexto lo requiera, indica de forma clara el montaje, la ubicacion de assets y la jerarquia visual de cada elemento.'
].join(' ')

const defaultStyleGuideReverseEngineeringPrompt = `Contexto: Actúa como un experto en Brand Strategy y Prompt Engineering para modelos de IA generativa. 
Tarea: Analiza las imágenes adjuntas y la descripción proporcionada para realizar una ingeniería inversa de su identidad visual. 
Objetivo: Crear una Guía de Estilo Técnica diseñada para que un generador de imágenes y un diseñador (o herramienta de composición) puedan replicar la estética de la marca con total consistencia.

Restricción de salida: Entrega EXCLUSIVAMENTE la guía de estilo siguiendo la estructura solicitada abajo. No incluyas introducciones, comentarios ni conclusiones. 

ESTRUCTURA DE LA GUIA DE ESTILO:

1. CONCEPTO ESTÉTICO CENTRAL: Define en una frase el "look & feel" técnico y emocional.
2. PALETA CROMÁTICA (DNA COLOR): Especifica Colores Dominantes (con códigos HEX si es posible deducirlos) y la Atmósfera Lumínica.
3. COMPOSICIÓN Y ENCUADRE: Define Ángulos de cámara, Profundidad de campo y uso del Espacio Negativo.
4. ILUMINACIÓN Y TEXTURA: Define el Tipo de Luz (ej. cenital, rembrandt, softbox) y el acabado de materiales (ej. mate, orgánico, metálico).

5. PROMPT MAESTRO (TEMPLATE DE DISEÑO): Crea un ejemplo de uso siguiendo estrictamente esta estructura:
    ---
    Prompt Visual: [Describe aquí la escena de fondo y el mood usando el estilo de la marca, incluyendo placeholders como {SUJETO}]
    Instrucciones de Montaje:
    - Fondo: [Descripción del entorno generado]
    - Centro: [Instrucción para colocar el producto o elemento principal de forma nítida]
    - Texto Superior: [Headline sugerido, Fuente y Color]
    - Texto Inferior: [Oferta o CTA, Estilo de sticker/botón y Subtítulo]
    - Assets: [Instrucción de integración de logos o elementos gráficos adjuntos]
    ---

6. PROMPT NEGATIVO (LO QUE DEBE EVITAR): Lista de elementos, colores o acabados que rompen la estética.

Responde en español técnico. Usa la descripción solo como contexto adicional y no inventes elementos que no se sostengan en las referencias visuales.`

function normalizeSettingsResponse(record?: typeof appSettings.$inferSelect | null): AppSettingsResponse {
  return {
    hasGeminiApiKey: Boolean(record?.geminiApiKey),
    conceptGeneratorPrompt: record?.conceptGeneratorPrompt || defaultConceptGeneratorPrompt,
    imageGeneratorPrompt: record?.imageGeneratorPrompt || defaultImageGeneratorPrompt,
    styleGuideReverseEngineeringPrompt: record?.styleGuideReverseEngineeringPrompt || defaultStyleGuideReverseEngineeringPrompt
  }
}

function getSettingsRecord() {
  return db.query.appSettings.findFirst({
    where: eq(appSettings.id, SETTINGS_ROW_ID)
  }).sync()
}

export function getDefaultSettings(): AppSettingsPayload {
  return {
    geminiApiKey: '',
    conceptGeneratorPrompt: defaultConceptGeneratorPrompt,
    imageGeneratorPrompt: defaultImageGeneratorPrompt,
    styleGuideReverseEngineeringPrompt: defaultStyleGuideReverseEngineeringPrompt
  }
}

export function getAppSettings(): AppSettingsResponse {
  return normalizeSettingsResponse(getSettingsRecord())
}

export function getServerAppSettings(): AppSettingsPayload {
  const record = getSettingsRecord()

  return {
    geminiApiKey: record?.geminiApiKey || '',
    conceptGeneratorPrompt: record?.conceptGeneratorPrompt || defaultConceptGeneratorPrompt,
    imageGeneratorPrompt: record?.imageGeneratorPrompt || defaultImageGeneratorPrompt,
    styleGuideReverseEngineeringPrompt: record?.styleGuideReverseEngineeringPrompt || defaultStyleGuideReverseEngineeringPrompt
  }
}

export function saveAppSettings(payload: AppSettingsPayload): AppSettingsResponse {
  const now = new Date()
  const existingRecord = getSettingsRecord()
  const normalizedPayload = {
    geminiApiKey: payload.geminiApiKey.trim() || existingRecord?.geminiApiKey || '',
    conceptGeneratorPrompt: payload.conceptGeneratorPrompt.trim(),
    imageGeneratorPrompt: payload.imageGeneratorPrompt.trim(),
    styleGuideReverseEngineeringPrompt: payload.styleGuideReverseEngineeringPrompt.trim()
  }

  if (!normalizedPayload.conceptGeneratorPrompt || !normalizedPayload.imageGeneratorPrompt || !normalizedPayload.styleGuideReverseEngineeringPrompt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'All generator prompts are required'
    })
  }

  db.insert(appSettings)
    .values({
      id: SETTINGS_ROW_ID,
      geminiApiKey: normalizedPayload.geminiApiKey,
      conceptGeneratorPrompt: normalizedPayload.conceptGeneratorPrompt,
      imageGeneratorPrompt: normalizedPayload.imageGeneratorPrompt,
      styleGuideReverseEngineeringPrompt: normalizedPayload.styleGuideReverseEngineeringPrompt,
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        geminiApiKey: normalizedPayload.geminiApiKey,
        conceptGeneratorPrompt: normalizedPayload.conceptGeneratorPrompt,
        imageGeneratorPrompt: normalizedPayload.imageGeneratorPrompt,
        styleGuideReverseEngineeringPrompt: normalizedPayload.styleGuideReverseEngineeringPrompt,
        updatedAt: now
      }
    })
    .run()

  return getAppSettings()
}

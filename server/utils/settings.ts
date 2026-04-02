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

function normalizeSettingsResponse(record?: typeof appSettings.$inferSelect | null): AppSettingsResponse {
  return {
    hasGeminiApiKey: Boolean(record?.geminiApiKey),
    conceptGeneratorPrompt: record?.conceptGeneratorPrompt || defaultConceptGeneratorPrompt,
    imageGeneratorPrompt: record?.imageGeneratorPrompt || defaultImageGeneratorPrompt
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
    imageGeneratorPrompt: defaultImageGeneratorPrompt
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
    imageGeneratorPrompt: record?.imageGeneratorPrompt || defaultImageGeneratorPrompt
  }
}

export function saveAppSettings(payload: AppSettingsPayload): AppSettingsResponse {
  const now = new Date()
  const existingRecord = getSettingsRecord()
  const normalizedPayload = {
    geminiApiKey: payload.geminiApiKey.trim() || existingRecord?.geminiApiKey || '',
    conceptGeneratorPrompt: payload.conceptGeneratorPrompt.trim(),
    imageGeneratorPrompt: payload.imageGeneratorPrompt.trim()
  }

  if (!normalizedPayload.conceptGeneratorPrompt || !normalizedPayload.imageGeneratorPrompt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Both generator prompts are required'
    })
  }

  db.insert(appSettings)
    .values({
      id: SETTINGS_ROW_ID,
      geminiApiKey: normalizedPayload.geminiApiKey,
      conceptGeneratorPrompt: normalizedPayload.conceptGeneratorPrompt,
      imageGeneratorPrompt: normalizedPayload.imageGeneratorPrompt,
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        geminiApiKey: normalizedPayload.geminiApiKey,
        conceptGeneratorPrompt: normalizedPayload.conceptGeneratorPrompt,
        imageGeneratorPrompt: normalizedPayload.imageGeneratorPrompt,
        updatedAt: now
      }
    })
    .run()

  return getAppSettings()
}

import { GoogleGenAI, Modality, Type } from '@google/genai'

import type { StudioBriefPayload, StudioConceptSeed } from '../../shared/types/studio'
import { getAppSettings } from './settings'

const textModel = 'gemini-3-flash-preview'
const imageModel = 'gemini-3.1-flash-image-preview'
const previewModel = 'imagen-4.0-generate-001'
const supportedPreviewRatios = new Set(['1:1', '3:4', '4:3', '9:16', '16:9'])

function getClient() {
  const settings = getAppSettings()
  const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing Gemini API key. Configure it in Settings.'
    })
  }

  return new GoogleGenAI({ apiKey })
}

function mapResolution(resolution: string): '1K' | '2K' | '4K' {
  if (resolution.includes('4K')) {
    return '4K'
  }

  if (resolution.includes('2K')) {
    return '2K'
  }

  return '1K'
}

function mapPreviewAspectRatio(aspectRatio: string): string {
  if (supportedPreviewRatios.has(aspectRatio)) {
    return aspectRatio
  }

  if (aspectRatio === '4:5') {
    return '3:4'
  }

  if (aspectRatio === '21:9') {
    return '16:9'
  }

  return '1:1'
}

function buildCreativePrompt(payload: StudioBriefPayload): string {
  const settings = getAppSettings()

  return [
    settings.conceptGeneratorPrompt,
    `Genera ${payload.conceptCount} conceptos visuales distintos para una campana publicitaria.`,
    `Para cada concepto debes entregar prompts especificos para estos ratios: ${payload.aspectRatios.join(', ')}.`,
    `El concepto debe mantenerse consistente entre ratios; solo adapta composicion y distribucion para cada formato.`,
    `Proyecto: ${payload.projectName}.`,
    `Marca: ${payload.brand || 'Sin marca especificada'}.`,
    `Objetivo: ${payload.goal}.`,
    `Accion esperada: ${payload.audienceAction || 'No definida'}.`,
    `Mensaje clave: ${payload.keyMessage || 'No definido'}.`,
    `Canales: ${payload.mediaChannels.join(', ') || 'No definidos'}.`,
    `Contexto adicional: ${payload.additionalContext || 'Sin contexto adicional'}.`,
    `Responde en espanol claro y profesional.`,
    `Los prompts deben ser directamente utilizables para generar imagen publicitaria.`
  ].join(' ')
}

function buildImagePrompt(prompt: string): string {
  const settings = getAppSettings()

  return [settings.imageGeneratorPrompt, prompt].join('\n\n')
}

export async function generateConceptSeeds(payload: StudioBriefPayload): Promise<StudioConceptSeed[]> {
  const ai = getClient()

  const variantPromptProperties = Object.fromEntries(payload.aspectRatios.map((ratio) => [ratio, {
    type: Type.STRING,
    description: `Prompt visual completo optimizado para ${ratio}`
  }]))

  const response = await ai.models.generateContent({
    model: textModel,
    contents: buildCreativePrompt(payload),
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            rationale: { type: Type.STRING },
            variantPrompts: {
              type: Type.OBJECT,
              properties: variantPromptProperties,
              required: payload.aspectRatios
            }
          },
          required: ['title', 'subtitle', 'rationale', 'variantPrompts']
        }
      }
    }
  })

  const text = response.text?.trim()

  if (!text) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Gemini did not return concept data'
    })
  }

  return JSON.parse(text) as StudioConceptSeed[]
}

export async function generatePreviewImage(prompt: string, aspectRatio: string): Promise<string> {
  const ai = getClient()

  const response = await ai.models.generateImages({
    model: previewModel,
    prompt: buildImagePrompt(prompt),
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: mapPreviewAspectRatio(aspectRatio)
    }
  })

  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes

  if (!imageBytes) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Imagen did not return preview image bytes'
    })
  }

  return `data:image/jpeg;base64,${imageBytes}`
}

export async function generateFinalImage(prompt: string, aspectRatio: string, resolution: string): Promise<string> {
  const ai = getClient()

  const response = await ai.models.generateContent({
    model: imageModel,
    contents: buildImagePrompt(prompt),
    config: {
      responseModalities: [Modality.IMAGE],
      imageConfig: {
        aspectRatio,
        imageSize: mapResolution(resolution)
      }
    }
  })

  const imageBytes = response.data

  if (!imageBytes) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Gemini did not return final image bytes'
    })
  }

  return `data:image/png;base64,${imageBytes}`
}

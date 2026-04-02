import { GoogleGenAI, Type } from '@google/genai'

import type { StudioBriefPayload, StudioConceptSeed } from '../../shared/types/studio'
import { getAppSettings, getServerAppSettings } from './settings'

const textModel = 'gemini-3-flash-preview'
const imageModel = 'gemini-3.1-flash-image-preview'
const previewModel = 'imagen-4.0-generate-001'
const supportedPreviewRatios = new Set(['1:1', '3:4', '4:3', '9:16', '16:9'])

function getClient() {
  const settings = getServerAppSettings()
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

function buildFinalImagePrompt(prompt: string): string {
  return [
    prompt,
    'Genera la imagen final directamente.',
    'No describas el prompt.',
    'No expliques lo que vas a hacer.',
    'No devuelvas texto.',
    'Devuelve solo la imagen generada.'
  ].join('\n\n')
}

function extractInlineImage(response: unknown): { data: string, mimeType: string } | null {
  if (!response || typeof response !== 'object') {
    return null
  }

  const responseRecord = response as {
    data?: string
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: {
            data?: string
            mimeType?: string
          }
        }>
      }
    }>
  }

  if (responseRecord.data) {
    return {
      data: responseRecord.data,
      mimeType: 'image/png'
    }
  }

  for (const candidate of responseRecord.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData?.data) {
        return {
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png'
        }
      }
    }
  }

  return null
}

function summarizeGenerateContentResponse(response: unknown) {
  if (!response || typeof response !== 'object') {
    return { kind: typeof response }
  }

  const responseRecord = response as {
    text?: string
    data?: string
    candidates?: Array<{
      finishReason?: string
      content?: {
        parts?: Array<{
          text?: string
          inlineData?: {
            data?: string
            mimeType?: string
          }
        }>
      }
    }>
  }

  return {
    topLevelKeys: Object.keys(responseRecord),
    hasText: false,
    hasData: Boolean(responseRecord.data),
    dataLength: responseRecord.data?.length || 0,
    candidates: (responseRecord.candidates || []).map((candidate, candidateIndex) => ({
      candidateIndex,
      finishReason: candidate.finishReason || null,
      parts: (candidate.content?.parts || []).map((part, partIndex) => ({
        partIndex,
        partKeys: Object.keys(part),
        hasText: Boolean(part.text),
        textPreview: part.text?.slice(0, 160) || null,
        hasInlineData: Boolean(part.inlineData?.data),
        inlineMimeType: part.inlineData?.mimeType || null,
        inlineDataLength: part.inlineData?.data?.length || 0
      }))
    }))
  }
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
  const mappedResolution = mapResolution(resolution)

  console.info('[gemini.final.request]', {
    model: imageModel,
    aspectRatio,
    resolution,
    mappedResolution,
    promptLength: prompt.length,
    promptPreview: prompt.slice(0, 200)
  })

  async function requestImage(promptText: string) {
    return ai.models.generateContent({
      model: imageModel,
      contents: {
        parts: [
          {
            text: promptText
          }
        ]
      },
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio,
          imageSize: mappedResolution
        }
      }
    })
  }

  const response = await requestImage(prompt)

  console.info('[gemini.final.response]', JSON.stringify(summarizeGenerateContentResponse(response), null, 2))

  const image = extractInlineImage(response)

  if (!image) {
    console.error('[gemini.final.no-image]', JSON.stringify(summarizeGenerateContentResponse(response), null, 2))

    throw createError({
      statusCode: 502,
      statusMessage: 'Gemini did not return final image bytes'
    })
  }

  return `data:${image.mimeType};base64,${image.data}`
}

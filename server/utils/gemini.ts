import { GoogleGenAI, Type } from '@google/genai'

import type { StudioBriefPayload, StudioConceptSeed } from '../../shared/types/studio'
import { getAssetInlineDataByIds, getAssetsByIds } from './assets'
import { getActiveCreativeStyles } from './creative-styles'
import { getAppSettings, getServerAppSettings } from './settings'
import { getStyleGuidesByIds } from './style-guides'

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

function shuffleArray<T>(items: T[]) {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = next[index]

    next[index] = next[randomIndex] as T
    next[randomIndex] = current as T
  }

  return next
}

function normalizeCreativeStyleSelection(
  payload: StudioBriefPayload,
  seed: StudioConceptSeed,
  activeCreativeStyleIds: Set<number>
): StudioConceptSeed {
  if (payload.styleGuideId) {
    return {
      ...seed,
      creativeStyleId: null,
      creativeStyleName: ''
    }
  }

  if (payload.creativeStyleId) {
    return {
      ...seed,
      creativeStyleId: payload.creativeStyleId,
      creativeStyleName: seed.creativeStyleName || ''
    }
  }

  if (!seed.creativeStyleId || !activeCreativeStyleIds.has(seed.creativeStyleId)) {
    return {
      ...seed,
      creativeStyleId: null,
      creativeStyleName: seed.creativeStyleName || ''
    }
  }

  return seed
}

function buildCreativePrompt(payload: StudioBriefPayload): string {
  const settings = getAppSettings()
  const selectedAssets = getAssetsByIds(Array.isArray(payload.assetIds) ? payload.assetIds : [])
  const creativeStyles = getActiveCreativeStyles()
  const shuffledCreativeStyles = shuffleArray(creativeStyles)
  const legacyStyleGuideIds = Array.isArray(payload.styleGuideIds) ? payload.styleGuideIds : []
  const selectedGuide = getStyleGuidesByIds(payload.styleGuideId ? [payload.styleGuideId] : legacyStyleGuideIds.slice(0, 1))[0]
  const styleGuideSection = selectedGuide
    ? `Guia de estilo aplicada: ${selectedGuide.name}${selectedGuide.brandName ? ` (${selectedGuide.brandName})` : ' (Global)'}: ${selectedGuide.content}`
    : 'Guia de estilo aplicada: ninguna.'
  const selectedCreativeStyle = payload.creativeStyleId
    ? creativeStyles.find((style) => style.id === payload.creativeStyleId) ?? null
    : null
  const assetSection = selectedAssets.length
    ? `Assets seleccionados: ${selectedAssets.map((asset) => {
      const scope = asset.brandName ? `marca ${asset.brandName}` : 'global'
      const tags = asset.tags.length ? ` Tags: ${asset.tags.join(', ')}.` : ''

      return `${asset.name} (${scope}). Descripcion: ${asset.description || 'Sin descripcion.'}${tags} Archivo: ${asset.fileUrl}.`
    }).join(' ')}`
    : 'Assets seleccionados: ninguno.'
  const styleGuideNotes = payload.styleGuideNotes?.trim()
  const creativeStyleSection = selectedGuide
    ? 'Estilo creativo libre: desactivado porque ya existe una guia aplicada.'
    : selectedCreativeStyle
      ? `Estilo creativo fijo: ${selectedCreativeStyle.name}. ${selectedCreativeStyle.description || 'Sin descripcion adicional.'}`
      : shuffledCreativeStyles.length
        ? [
          'Biblioteca de estilos creativos disponible para que elijas el mas adecuado por concepto:',
          ...shuffledCreativeStyles.map((style, index) => `${index + 1}. [${style.id}] ${style.name}. ${style.description || 'Sin descripcion adicional.'}`),
          'Debes escoger el estilo mas apropiado para cada concepto segun la idea, el texto y la composicion. No fuerces siempre el mismo estilo ni repitas el mismo estilo en todos los conceptos si existen alternativas viables.'
        ].join(' ')
        : 'No hay estilos creativos configurados. Decide libremente el lenguaje visual de cada concepto.'

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
    assetSection,
    styleGuideSection,
    creativeStyleSection,
    `Ajustes adicionales de guia: ${styleGuideNotes || 'Ninguno'}.`,
    selectedGuide
      ? 'Si existe una guia aplicada, no elijas un estilo creativo libre: la guia debe gobernar la direccion visual.'
      : selectedCreativeStyle
        ? 'Todos los conceptos deben respetar exactamente el estilo creativo fijo indicado.'
        : 'Cuando no haya estilo fijo, elige el estilo mas conveniente para cada concepto y reportalo en la salida JSON.',
    `Responde en espanol claro y profesional.`,
    `Los prompts deben ser directamente utilizables para generar imagen publicitaria.`
  ].join(' ')
}

function buildImagePrompt(prompt: string, assetIds: number[] = [], includeAssetReferences = true): string {
  const settings = getAppSettings()
  const selectedAssets = getAssetsByIds(assetIds)
  const assetSection = selectedAssets.length
    ? [
      'Assets de referencia seleccionados:',
      ...selectedAssets.map((asset, index) => `${index + 1}. ${asset.name}. Descripcion: ${asset.description || 'Sin descripcion.'} Tags: ${asset.tags.join(', ') || 'sin tags'}. Archivo: ${asset.fileUrl}.`)
    ].join('\n')
    : 'Assets de referencia seleccionados: ninguno.'

  return includeAssetReferences
    ? [settings.imageGeneratorPrompt, assetSection, prompt].join('\n\n')
    : [settings.imageGeneratorPrompt, prompt].join('\n\n')
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

const reverseEngineeringImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function reverseEngineerStyleGuide(files: File[], description: string): Promise<string> {
  const ai = getClient()
  const settings = getServerAppSettings()
  const validFiles = files.filter((file) => reverseEngineeringImageMimeTypes.has(file.type))

  if (!validFiles.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one JPG, PNG, or WEBP image is required'
    })
  }

  const parts = [
    {
      text: [
        settings.styleGuideReverseEngineeringPrompt,
        `Descripcion adicional: ${description.trim() || 'Ninguna.'}`,
        `Cantidad de referencias visuales: ${validFiles.length}.`
      ].join('\n\n')
    }
  ]

  for (const file of validFiles) {
    const buffer = Buffer.from(await file.arrayBuffer())
    parts.push({
      text: `Referencia visual: ${file.name || 'imagen'}.`
    })
    parts.push({
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: file.type
      }
    })
  }

  const response = await ai.models.generateContent({
    model: textModel,
    contents: {
      parts
    }
  })

  const text = response.text?.trim()

  if (!text) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Gemini did not return a style guide'
    })
  }

  return text
}

export async function generateConceptSeeds(payload: StudioBriefPayload): Promise<StudioConceptSeed[]> {
  const ai = getClient()
  const activeCreativeStyleIds = new Set(getActiveCreativeStyles().map((style) => style.id))

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
            creativeStyleId: { type: Type.INTEGER },
            creativeStyleName: { type: Type.STRING },
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            rationale: { type: Type.STRING },
            variantPrompts: {
              type: Type.OBJECT,
              properties: variantPromptProperties,
              required: payload.aspectRatios
            }
          },
          required: ['creativeStyleId', 'creativeStyleName', 'title', 'subtitle', 'rationale', 'variantPrompts']
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

  const parsed = JSON.parse(text) as StudioConceptSeed[]

  return parsed.map((seed) => normalizeCreativeStyleSelection(payload, seed, activeCreativeStyleIds))
}

export async function generatePreviewImage(prompt: string, aspectRatio: string, assetIds: number[] = []): Promise<string> {
  const ai = getClient()

  const response = await ai.models.generateImages({
    model: previewModel,
    prompt: buildImagePrompt(prompt, assetIds, false),
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

export async function generateFinalImage(prompt: string, aspectRatio: string, resolution: string, assetIds: number[] = []): Promise<string> {
  const ai = getClient()
  const mappedResolution = mapResolution(resolution)
  const assetInlineData = await getAssetInlineDataByIds(assetIds)

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
          ...assetInlineData.map(({ asset, inlineData }) => ({
            text: `Asset de referencia: ${asset.name}.`
          })),
          ...assetInlineData.map(({ inlineData }) => ({ inlineData })),
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

  const response = await requestImage(buildImagePrompt(prompt, assetIds))

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

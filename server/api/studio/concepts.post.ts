import type { StudioBriefPayload, StudioConcept, StudioConceptFormat, StudioConceptResponse, StudioVariant } from '../../../shared/types/studio'

const previewPalette = ['7d9e7e', '9f8d77', '7a6f96', '8b6b5e', '5e7d88']

function createVariant(conceptTitle: string, ratio: string, prompt: string, seed: string): StudioVariant {
  const color = previewPalette[Math.abs(seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % previewPalette.length]
  const label = `Preview ${ratio}`

  return {
    id: `${seed}-preview-1`,
    label,
    mode: 'preview',
    prompt,
    imageUrl: `https://placehold.co/1200x1200/${color}/f5f4f0?text=${encodeURIComponent(`${conceptTitle}\n${ratio}\nImagen 4`)}`,
    createdAt: new Date().toISOString()
  }
}

function buildPrompt(payload: StudioBriefPayload, conceptTitle: string, ratio: string, index: number): string {
  return [
    `Concepto: ${conceptTitle}.`,
    `Formato: ${ratio}.`,
    `Objetivo: ${payload.goal}.`,
    `Mensaje clave: ${payload.keyMessage || 'Mensaje pendiente de refinar.'}`,
    `Accion esperada: ${payload.audienceAction || 'Sin accion definida.'}`,
    `Canales: ${payload.mediaChannels.join(', ') || 'Sin canales.'}.`,
    `Contexto adicional: ${payload.additionalContext || 'Sin contexto adicional.'}`,
    `Direccion visual: anuncio publicitario sobrio, version ${index + 1}, misma idea adaptada al ratio.`
  ].join(' ')
}

function createConcept(payload: StudioBriefPayload, index: number): StudioConcept {
  const sequence = (payload.conceptOffset || 0) + index
  const titleBase = payload.keyMessage || payload.projectName || 'Concepto'
  const title = `${titleBase.split(' ').slice(0, 2).join(' ') || 'Concepto'} ${sequence + 1}`
  const subtitle = payload.audienceAction || `Ruta creativa para ${payload.goal.toLowerCase()}`
  const previewSourceRatio = payload.aspectRatios[0] || '1:1'
  const formats: StudioConceptFormat[] = payload.aspectRatios.map((ratio) => {
    const promptDraft = buildPrompt(payload, title, ratio, sequence)
    const isPreviewSource = ratio === previewSourceRatio
    const variant = isPreviewSource
      ? createVariant(title, ratio, promptDraft, `${title}-${ratio}-${sequence}`)
      : null

    return {
      ratio,
      isPreviewSource,
      promptDraft,
      variants: variant ? [variant] : [],
      activeVariantId: variant?.id || null
    }
  })

  return {
    id: `concept-${sequence + 1}`,
    title,
    subtitle,
    rationale: `Explora una lectura visual alineada con ${payload.goal.toLowerCase()} y adaptada a ${payload.mediaChannels.join(', ') || 'los canales seleccionados'}.`,
    selectedRatio: payload.aspectRatios[0] || '1:1',
    approvedAt: null,
    formats
  }
}

export default defineEventHandler(async (event): Promise<StudioConceptResponse> => {
  const payload = await readBody<StudioBriefPayload>(event)

  const concepts = Array.from({ length: payload.conceptCount }, (_, index) => createConcept(payload, index))

  return { concepts }
})

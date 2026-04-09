export interface AppSettingsPayload {
  geminiApiKey: string
  conceptGeneratorPrompt: string
  imageGeneratorPrompt: string
  styleGuideReverseEngineeringPrompt: string
}

export interface AppSettingsResponse {
  hasGeminiApiKey: boolean
  conceptGeneratorPrompt: string
  imageGeneratorPrompt: string
  styleGuideReverseEngineeringPrompt: string
}

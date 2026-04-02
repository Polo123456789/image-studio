export interface AppSettingsPayload {
  geminiApiKey: string
  conceptGeneratorPrompt: string
  imageGeneratorPrompt: string
}

export interface AppSettingsResponse {
  hasGeminiApiKey: boolean
  conceptGeneratorPrompt: string
  imageGeneratorPrompt: string
}

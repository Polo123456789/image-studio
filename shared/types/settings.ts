export interface AppSettingsPayload {
  geminiApiKey: string
  conceptGeneratorPrompt: string
  imageGeneratorPrompt: string
}

export interface AppSettingsResponse extends AppSettingsPayload {
  hasGeminiApiKey: boolean
}

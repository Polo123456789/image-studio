export interface CreativeStyleRecord {
  id: number
  name: string
  description: string
  referenceImageUrl: string | null
  position: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreativeStyleInput {
  name: string
  description: string
  position?: number
  isActive: boolean
}

export interface CreativeStylesResponse {
  styles: CreativeStyleRecord[]
}

export interface CreativeStyleResponse {
  style: CreativeStyleRecord
}

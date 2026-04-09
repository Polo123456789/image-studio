import type { BrandOption } from './brands'

export interface StyleGuideRecord {
  id: number
  name: string
  content: string
  brandId: number | null
  brandName: string | null
  createdAt: string
  updatedAt: string
}

export interface StyleGuidePayload {
  name: string
  content: string
  brandId: number | null
}

export interface StyleGuidesResponse {
  guides: StyleGuideRecord[]
  brands: BrandOption[]
}

export interface ReverseEngineeredStyleGuideResponse {
  content: string
}

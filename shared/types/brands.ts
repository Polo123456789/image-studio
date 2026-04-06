export interface BrandOption {
  id: number
  name: string
  description: string | null
  defaultStyleGuideId: number | null
  defaultStyleGuideName: string | null
}

export interface BrandRecord extends BrandOption {
  assetCount: number
  styleGuideCount: number
  createdAt: string
  updatedAt: string
}

export interface BrandPayload {
  name: string
  description: string
  defaultStyleGuideId: number | null
}

export interface BrandsResponse {
  brands: BrandRecord[]
}

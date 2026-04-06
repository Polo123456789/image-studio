import type { BrandOption } from './style-guides'

export interface AssetRecord {
  id: number
  name: string
  originalFileName: string
  fileUrl: string
  mimeType: string
  fileSize: number
  hash: string
  description: string
  tags: string[]
  brandId: number | null
  brandName: string | null
  createdAt: string
  updatedAt: string
}

export interface AssetsResponse {
  assets: AssetRecord[]
  brands: BrandOption[]
}

export interface AssetUploadResponse {
  asset: AssetRecord
  duplicate: boolean
}

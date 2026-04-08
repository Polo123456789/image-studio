import type { BrandOption } from './brands'

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

export interface AssetUploadItem {
  asset: AssetRecord
  duplicate: boolean
}

export interface AssetUploadResponse {
  uploads: AssetUploadItem[]
}

export interface AssetUpdatePayload {
  brandId: number | null
}

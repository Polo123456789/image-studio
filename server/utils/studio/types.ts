import type { db } from '../../db/client'
import type {
  studioConceptFormats,
  studioConcepts,
  studioProjects,
  studioVariants
} from '../../db/schema'

export type StudioProjectRow = typeof studioProjects.$inferSelect
export type StudioConceptRow = typeof studioConcepts.$inferSelect
export type StudioConceptFormatRow = typeof studioConceptFormats.$inferSelect
export type StudioVariantRow = typeof studioVariants.$inferSelect
export type StudioTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

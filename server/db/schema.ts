import { relations } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const appSettings = sqliteTable('app_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  geminiApiKey: text('gemini_api_key'),
  conceptGeneratorPrompt: text('concept_generator_prompt').notNull(),
  imageGeneratorPrompt: text('image_generator_prompt').notNull(),
  styleGuideReverseEngineeringPrompt: text('style_guide_reverse_engineering_prompt').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull()
})

export const brands = sqliteTable('brands', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  defaultStyleGuideId: integer('default_style_guide_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull()
})

export const styleGuides = sqliteTable('style_guides', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  content: text('content').notNull(),
  brandId: integer('brand_id').references(() => brands.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull()
}, (table) => ({
  nameBrandUnique: uniqueIndex('style_guides_name_brand_unique').on(table.name, table.brandId)
}))

export const assets = sqliteTable('assets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  originalFileName: text('original_file_name').notNull(),
  filePath: text('file_path').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  hash: text('hash').notNull(),
  description: text('description').notNull().default(''),
  tags: text('tags').notNull().default('[]'),
  brandId: integer('brand_id').references(() => brands.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull()
}, (table) => ({
  hashUnique: uniqueIndex('assets_hash_unique').on(table.hash)
}))

export const creativeStyles = sqliteTable('creative_styles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  referenceImagePath: text('reference_image_path'),
  position: integer('position').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull()
}, (table) => ({
  nameUnique: uniqueIndex('creative_styles_name_unique').on(table.name)
}))

export const studioProjects = sqliteTable('studio_projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull(),
  projectName: text('project_name').notNull(),
  brief: text('brief').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull()
}, (table) => ({
  slugUnique: uniqueIndex('studio_projects_slug_unique').on(table.slug)
}))

export const studioConcepts = sqliteTable('studio_concepts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => studioProjects.id),
  conceptKey: text('concept_key').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  rationale: text('rationale').notNull(),
  creativeStyleId: integer('creative_style_id').references(() => creativeStyles.id),
  creativeStyleName: text('creative_style_name'),
  selectedRatio: text('selected_ratio').notNull(),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  position: integer('position').notNull(),
  discardedAt: integer('discarded_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull()
}, (table) => ({
  projectConceptUnique: uniqueIndex('studio_concepts_project_id_concept_key_unique').on(table.projectId, table.conceptKey)
}))

export const studioConceptFormats = sqliteTable('studio_concept_formats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  conceptId: integer('concept_id').notNull().references(() => studioConcepts.id),
  ratio: text('ratio').notNull(),
  isPreviewSource: integer('is_preview_source', { mode: 'boolean' }).notNull().default(false),
  promptDraft: text('prompt_draft').notNull(),
  activeVariantKey: text('active_variant_key'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull()
}, (table) => ({
  conceptFormatUnique: uniqueIndex('studio_concept_formats_concept_id_ratio_unique').on(table.conceptId, table.ratio)
}))

export const studioVariants = sqliteTable('studio_variants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  formatId: integer('format_id').notNull().references(() => studioConceptFormats.id),
  variantKey: text('variant_key').notNull(),
  label: text('label').notNull(),
  mode: text('mode').notNull(),
  prompt: text('prompt').notNull(),
  imageUrl: text('image_url').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull()
}, (table) => ({
  formatVariantUnique: uniqueIndex('studio_variants_format_id_variant_key_unique').on(table.formatId, table.variantKey)
}))

export const brandsRelations = relations(brands, ({ many, one }) => ({
  assets: many(assets),
  styleGuides: many(styleGuides),
  defaultStyleGuide: one(styleGuides, {
    fields: [brands.defaultStyleGuideId],
    references: [styleGuides.id]
  })
}))

export const styleGuidesRelations = relations(styleGuides, ({ one }) => ({
  brand: one(brands, {
    fields: [styleGuides.brandId],
    references: [brands.id]
  })
}))

export const assetsRelations = relations(assets, ({ one }) => ({
  brand: one(brands, {
    fields: [assets.brandId],
    references: [brands.id]
  })
}))

export const creativeStylesRelations = relations(creativeStyles, ({ many }) => ({
  concepts: many(studioConcepts)
}))

export const studioProjectsRelations = relations(studioProjects, ({ many }) => ({
  concepts: many(studioConcepts)
}))

export const studioConceptsRelations = relations(studioConcepts, ({ one, many }) => ({
  project: one(studioProjects, {
    fields: [studioConcepts.projectId],
    references: [studioProjects.id]
  }),
  creativeStyle: one(creativeStyles, {
    fields: [studioConcepts.creativeStyleId],
    references: [creativeStyles.id]
  }),
  formats: many(studioConceptFormats)
}))

export const studioConceptFormatsRelations = relations(studioConceptFormats, ({ one, many }) => ({
  concept: one(studioConcepts, {
    fields: [studioConceptFormats.conceptId],
    references: [studioConcepts.id]
  }),
  variants: many(studioVariants)
}))

export const studioVariantsRelations = relations(studioVariants, ({ one }) => ({
  format: one(studioConceptFormats, {
    fields: [studioVariants.formatId],
    references: [studioConceptFormats.id]
  })
}))

import { relations } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const appSettings = sqliteTable('app_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  geminiApiKey: text('gemini_api_key'),
  conceptGeneratorPrompt: text('concept_generator_prompt').notNull(),
  imageGeneratorPrompt: text('image_generator_prompt').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull()
})

export const brands = sqliteTable('brands', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
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
  brandIdUnique: uniqueIndex('style_guides_brand_id_unique').on(table.brandId)
}))

export const assets = sqliteTable('assets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  filePath: text('file_path').notNull(),
  description: text('description'),
  tags: text('tags'),
  brandId: integer('brand_id').references(() => brands.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull()
})

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  brief: text('brief'),
  rules: text('rules'),
  generationCount: integer('generation_count').notNull().default(4),
  brandId: integer('brand_id').references(() => brands.id),
  styleGuideId: integer('style_guide_id').references(() => styleGuides.id),
  folderPath: text('folder_path').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull()
})

export const projectAssets = sqliteTable('project_assets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => projects.id),
  assetId: integer('asset_id').notNull().references(() => assets.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull()
}, (table) => ({
  projectAssetUnique: uniqueIndex('project_assets_project_id_asset_id_unique').on(table.projectId, table.assetId)
}))

export const images = sqliteTable('images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => projects.id),
  name: text('name').notNull(),
  folderPath: text('folder_path').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull()
})

export const imageVersions = sqliteTable('image_versions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  imageId: integer('image_id').notNull().references(() => images.id),
  versionNumber: integer('version_number').notNull(),
  prompt: text('prompt').notNull(),
  filePath: text('file_path').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull()
})

export const brandsRelations = relations(brands, ({ many }) => ({
  assets: many(assets),
  projects: many(projects),
  styleGuides: many(styleGuides)
}))

export const styleGuidesRelations = relations(styleGuides, ({ one, many }) => ({
  brand: one(brands, {
    fields: [styleGuides.brandId],
    references: [brands.id]
  }),
  projects: many(projects)
}))

export const assetsRelations = relations(assets, ({ one, many }) => ({
  brand: one(brands, {
    fields: [assets.brandId],
    references: [brands.id]
  }),
  projectAssets: many(projectAssets)
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  brand: one(brands, {
    fields: [projects.brandId],
    references: [brands.id]
  }),
  styleGuide: one(styleGuides, {
    fields: [projects.styleGuideId],
    references: [styleGuides.id]
  }),
  selectedAssets: many(projectAssets),
  images: many(images)
}))

export const projectAssetsRelations = relations(projectAssets, ({ one }) => ({
  project: one(projects, {
    fields: [projectAssets.projectId],
    references: [projects.id]
  }),
  asset: one(assets, {
    fields: [projectAssets.assetId],
    references: [assets.id]
  })
}))

export const imagesRelations = relations(images, ({ one, many }) => ({
  project: one(projects, {
    fields: [images.projectId],
    references: [projects.id]
  }),
  versions: many(imageVersions)
}))

export const imageVersionsRelations = relations(imageVersions, ({ one }) => ({
  image: one(images, {
    fields: [imageVersions.imageId],
    references: [images.id]
  })
}))

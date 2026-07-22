import { resolve } from 'node:path'

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dbCredentials: {
    url: resolve(process.cwd(), process.env.IMAGE_STUDIO_DB_PATH || 'server/db/local.db')
  }
})

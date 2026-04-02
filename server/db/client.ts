import { resolve } from 'node:path'

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

import * as schema from './schema'

const sqlite = new Database(resolve(process.cwd(), 'server/db/local.db'))

export const db = drizzle(sqlite, { schema })

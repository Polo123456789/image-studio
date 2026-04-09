import { resolve } from 'node:path'

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

import * as schema from './schema'

export const sqliteFilePath = resolve(process.cwd(), 'server/db/local.db')

function createSqliteConnection() {
  return new Database(sqliteFilePath)
}

function createDrizzleClient(connection: Database.Database) {
  return drizzle(connection, { schema })
}

let sqlite = createSqliteConnection()
let currentDb = createDrizzleClient(sqlite)

type DrizzleClient = typeof currentDb

export const db = new Proxy({} as DrizzleClient, {
  get(_target, property, receiver) {
    const value = Reflect.get(currentDb, property, receiver)

    return typeof value === 'function' ? value.bind(currentDb) : value
  },
  has(_target, property) {
    return property in currentDb
  },
  ownKeys() {
    return Reflect.ownKeys(currentDb)
  },
  getOwnPropertyDescriptor(_target, property) {
    const descriptor = Object.getOwnPropertyDescriptor(currentDb, property)

    if (!descriptor) {
      return undefined
    }

    return {
      ...descriptor,
      configurable: true
    }
  }
})

export function closeDbConnection() {
  sqlite.close()
}

export function reopenDbConnection() {
  sqlite = createSqliteConnection()
  currentDb = createDrizzleClient(sqlite)
}

export function resetDbConnection() {
  closeDbConnection()
  reopenDbConnection()
}

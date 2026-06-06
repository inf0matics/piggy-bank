import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { CREATE_USERS_TABLE, rowToUser, type UserRow, type UserSchema } from '../domain/user'

let dbCache: DatabaseSync | null = null

const resolveDbPath = (): string => {
  return process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.resolve(process.cwd(), 'data/piggy-bank.db')
}

const getDb = (): DatabaseSync => {
  if (dbCache == null) {
    const dbPath = resolveDbPath()
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    dbCache = new DatabaseSync(dbPath)
    dbCache.exec(CREATE_USERS_TABLE)
  }
  return dbCache
}

/** Opens the DB and ensures the schema exists. Called once on server startup. */
export const initUserStore = (): void => {
  getDb()
}

export const getUserByAccessKey = (accessKey: string): UserSchema | null => {
  const row = getDb()
    .prepare('SELECT * FROM users WHERE access_key = ?')
    .get(accessKey) as UserRow | undefined
  return row ? rowToUser(row) : null
}

export const getUserById = (id: string): UserSchema | null => {
  const row = getDb()
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(id) as UserRow | undefined
  return row ? rowToUser(row) : null
}

export const countUsers = (): number => {
  const row = getDb().prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number }
  return row.count
}

import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import {
  CREATE_SETTINGS_TABLE,
  CREATE_USERS_TABLE,
  rowToUser,
  type UserInput,
  type UserRow,
  type UserSchema,
} from '../domain/user'

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
    dbCache.exec(CREATE_SETTINGS_TABLE)
  }
  return dbCache
}

/** Opens the DB and ensures the schema exists. Called once on server startup. */
export const initUserStore = (): void => {
  getDb()
}

// --- Reads used by the PIN app / auth ---

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

// --- Admin CRUD ---

export const getAllUsers = (): UserSchema[] => {
  const rows = getDb()
    .prepare('SELECT * FROM users ORDER BY name COLLATE NOCASE')
    .all() as UserRow[]
  return rows.map(rowToUser)
}

export const insertUser = (input: UserInput): UserSchema => {
  const id = randomUUID()
  getDb()
    .prepare(`
      INSERT INTO users (id, name, access_key, lnbits_url, lnbits_invoice_key)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(id, input.name, input.accessKey, input.lnbitsUrl, input.invoiceKey)
  return getUserById(id) as UserSchema
}

export const updateUser = (id: string, input: UserInput): UserSchema | null => {
  const result = getDb()
    .prepare(`
      UPDATE users
      SET name = ?, access_key = ?, lnbits_url = ?, lnbits_invoice_key = ?
      WHERE id = ?
    `)
    .run(input.name, input.accessKey, input.lnbitsUrl, input.invoiceKey, id)
  if (result.changes === 0) {
    return null
  }
  return getUserById(id)
}

export const deleteUser = (id: string): boolean => {
  const result = getDb().prepare('DELETE FROM users WHERE id = ?').run(id)
  return result.changes > 0
}

// --- Settings (key/value) ---

export const getSetting = (key: string): string | null => {
  const row = getDb()
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(key) as { value: string } | undefined
  return row ? row.value : null
}

export const setSetting = (key: string, value: string): void => {
  getDb()
    .prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `)
    .run(key, value)
}

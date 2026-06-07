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

// Adds the `owner` column to pre-ownership databases. New DBs already get it via
// CREATE_USERS_TABLE; this backfills existing ones (PRAGMA can't be parameterised).
const ensureOwnerColumn = (db: DatabaseSync): void => {
  const columns = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>
  if (!columns.some(c => c.name === 'owner')) {
    db.exec(`ALTER TABLE users ADD COLUMN owner TEXT NOT NULL DEFAULT ''`)
  }
}

const getDb = (): DatabaseSync => {
  if (dbCache == null) {
    const dbPath = resolveDbPath()
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    dbCache = new DatabaseSync(dbPath)
    dbCache.exec(CREATE_USERS_TABLE)
    dbCache.exec(CREATE_SETTINGS_TABLE)
    ensureOwnerColumn(dbCache)
  }
  return dbCache
}

/** Opens the DB and ensures the schema exists. Called once on server startup. */
export const initUserStore = (): void => {
  getDb()
}

// --- Reads used by the PIN app / auth (global: login is by PIN alone) ---

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

// --- Admin CRUD (scoped to the owning custodian's Logto sub) ---

export const getUsersByOwner = (owner: string): UserSchema[] => {
  const rows = getDb()
    .prepare('SELECT * FROM users WHERE owner = ? ORDER BY name COLLATE NOCASE')
    .all(owner) as UserRow[]
  return rows.map(rowToUser)
}

export const getOwnedUser = (id: string, owner: string): UserSchema | null => {
  const row = getDb()
    .prepare('SELECT * FROM users WHERE id = ? AND owner = ?')
    .get(id, owner) as UserRow | undefined
  return row ? rowToUser(row) : null
}

export const insertUser = (input: UserInput, owner: string): UserSchema => {
  const id = randomUUID()
  getDb()
    .prepare(`
      INSERT INTO users (id, name, access_key, lnbits_url, lnbits_invoice_key, owner)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(id, input.name, input.accessKey, input.lnbitsUrl, input.invoiceKey, owner)
  return getUserById(id) as UserSchema
}

export const updateOwnedUser = (id: string, owner: string, input: UserInput): UserSchema | null => {
  const result = getDb()
    .prepare(`
      UPDATE users
      SET name = ?, access_key = ?, lnbits_url = ?, lnbits_invoice_key = ?
      WHERE id = ? AND owner = ?
    `)
    .run(input.name, input.accessKey, input.lnbitsUrl, input.invoiceKey, id, owner)
  if (result.changes === 0) {
    return null
  }
  return getUserById(id)
}

export const deleteOwnedUser = (id: string, owner: string): boolean => {
  const result = getDb().prepare('DELETE FROM users WHERE id = ? AND owner = ?').run(id, owner)
  return result.changes > 0
}

// --- Settings (key/value, global) ---

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

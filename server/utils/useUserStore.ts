import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import {
  CREATE_SETTINGS_TABLE,
  CREATE_USERS_TABLE,
  migrateUsersTable,
  rowToUser,
  type BalanceChange,
  type UserInput,
  type UserRow,
  type UserSchema,
} from '../domain/user'
import type { WalletSource } from '../../utils/switchBack'

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
    migrateUsersTable(dbCache)
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
    .all(owner) as unknown as UserRow[]
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
      INSERT INTO users (id, name, access_key, lnbits_url, lnbits_invoice_key, owner, marbles_url, marbles_key, marbles_wallet)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(id, input.name, input.accessKey, input.lnbitsUrl, input.invoiceKey, owner,
      input.marbles?.url ?? null, input.marbles?.key ?? null, input.marbles?.wallet ?? null)
  return getUserById(id) as UserSchema
}

/**
 * Saves the form's fields. Null when the piggy bank is not the owner's, or
 * when it would drop the marbles settings while reading its balance from them.
 */
export const updateOwnedUser = (id: string, owner: string, input: UserInput): UserSchema | null => {
  const result = getDb()
    .prepare(`
      UPDATE users
      SET name = ?, access_key = ?, lnbits_url = ?, lnbits_invoice_key = ?,
          marbles_url = ?, marbles_key = ?, marbles_wallet = ?
      WHERE id = ? AND owner = ? AND (? IS NOT NULL OR balance_source != 'marbles')
    `)
    .run(input.name, input.accessKey, input.lnbitsUrl, input.invoiceKey,
      input.marbles?.url ?? null, input.marbles?.key ?? null, input.marbles?.wallet ?? null,
      id, owner, input.marbles?.key ?? null)
  if (result.changes === 0) {
    return null
  }
  return getUserById(id)
}

/**
 * Freezes a piggy bank read from the wallet `from` at `sats` and puts it on
 * the manual source, with `lastChange` as its last change (null: none to
 * show). The wallet settings are kept. Null when the piggy bank is not the
 * owner's or no longer on `from`.
 */
export const switchOwnedUserToManual = (id: string, owner: string, from: WalletSource, sats: number, lastChange: BalanceChange | null): UserSchema | null => {
  const result = getDb()
    .prepare(`
      UPDATE users
      SET balance_source = 'manual', manual_sats = ?, manual_changed_at = ?,
          manual_change_sats = ?, manual_change_comment = ?
      WHERE id = ? AND owner = ? AND balance_source = ?
    `)
    .run(sats, lastChange?.time ?? null, lastChange?.sats ?? null, lastChange?.comment ?? null, id, owner, from)
  return result.changes === 0 ? null : getUserById(id)
}

/**
 * Sets a manual piggy bank's balance to `sats` with `change` as its last change.
 * Null when the piggy bank is not the owner's or not manual.
 */
export const changeOwnedManualBalance = (id: string, owner: string, sats: number, change: BalanceChange): UserSchema | null => {
  const result = getDb()
    .prepare(`
      UPDATE users
      SET manual_sats = ?, manual_changed_at = ?, manual_change_sats = ?, manual_change_comment = ?
      WHERE id = ? AND owner = ? AND balance_source = 'manual'
    `)
    .run(sats, change.time, change.sats, change.comment, id, owner)
  return result.changes === 0 ? null : getUserById(id)
}

/**
 * Puts a manual piggy bank on the wallet `to` (LNBits, or marbles when its
 * settings are saved), provided its manual balance is still `manualSats` (the
 * one the custodian compared). The manual balance and last change are dropped:
 * the wallet is the balance again. Null when the piggy bank is not the
 * owner's, not manual, its manual balance changed, or it has no marbles
 * settings to switch to.
 */
export const switchOwnedUserToWallet = (id: string, owner: string, to: WalletSource, manualSats: number): UserSchema | null => {
  const result = getDb()
    .prepare(`
      UPDATE users
      SET balance_source = ?, manual_sats = NULL, manual_changed_at = NULL,
          manual_change_sats = NULL, manual_change_comment = NULL
      WHERE id = ? AND owner = ? AND balance_source = 'manual' AND manual_sats = ?
        AND (? = 'lnbits' OR marbles_key IS NOT NULL)
    `)
    .run(to, id, owner, manualSats, to)
  return result.changes === 0 ? null : getUserById(id)
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

import type { DatabaseSync } from 'node:sqlite'
import { z } from 'zod'
import { MAX_COMMENT_LENGTH, MAX_SATS } from '../../utils/manualBalanceChange.ts'

const LnBitsSchema = z.object({
  url: z.string(),
  invoiceKey: z.string(),
})

const BalanceChangeSchema = z.object({
  time: z.number(), // unix seconds
  sats: z.number().int(),
  comment: z.string().nullable(),
})

export type BalanceChange = z.infer<typeof BalanceChangeSchema>

// Where a piggy bank's balance comes from. `lnbits`: read live from the wallet.
// `manual`: a single sats balance the custodian manages in the admin; the app
// remembers only its last change (shown as "Last payment"), no history. Null
// when frozen from a wallet without payments. The LNBits URL and key are kept
// either way.
const BalanceSchema = z.discriminatedUnion('source', [
  z.object({ source: z.literal('lnbits') }),
  z.object({
    source: z.literal('manual'),
    sats: z.number().int().nonnegative(),
    lastChange: BalanceChangeSchema.nullable(),
  }),
])

export type Balance = z.infer<typeof BalanceSchema>

/** An LNBits payment (amount in millisats) as a change in whole sats. */
export const lnbitsPaymentToChange = (payment: { amount: number, comment: string | null, time: number }): BalanceChange => ({
  time: payment.time || 0,
  sats: Math.floor((payment.amount || 0) / 1000),
  comment: payment.comment || null,
})

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  accessKey: z.string(),
  lnbits: LnBitsSchema,
  balance: BalanceSchema,
})

export type UserSchema = z.infer<typeof UserSchema>

// Fields the admin UI submits when creating/editing a piggy bank (no id — it is
// generated on insert).
// Each field reports the same message whether it is empty, missing or of the
// wrong type, so the API's 400 always names the field.
const requiredString = (error: string) => z.string({ error }).trim().min(1, { error })

const lnbitsUrlError = 'A valid LNBits URL is required'

export const UserInputSchema = z.object({
  name: requiredString('Name is required'),
  accessKey: requiredString('PIN is required'),
  lnbitsUrl: z.string({ error: lnbitsUrlError }).trim().pipe(z.url({ error: lnbitsUrlError })),
  invoiceKey: requiredString('Invoice key is required'),
})

export type UserInput = z.infer<typeof UserInputSchema>

// A balance in whole sats, 0 up to the 21M BTC supply, refused with `error`.
const wholeSats = (error: string) => z.number({ error }).int({ error }).min(0, { error }).max(MAX_SATS, { error })

// Body of the switch to the manual source: the starting balance in sats.
export const ManualSwitchInputSchema = z.object({
  sats: wholeSats('The starting balance must be a whole number of sats, 0 or more'),
})

// Body of the switch back to LNBits: the manual and LNBits balances the
// custodian compared before confirming, so a balance that moved since is caught.
export const SwitchBackInputSchema = z.object({
  manualSats: wholeSats('The manual balance must be a whole number of sats'),
  lnbitsSats: wholeSats('The LNBits balance must be a whole number of sats'),
})

// Body of a manual balance change, converted from EUR by the admin view at the
// rate the custodian was shown: `set` the balance to `sats`, or `add` `sats`
// (negative: subtract). An empty comment is no comment.
const changeSatsError = 'The change must be a whole number of sats'
const changeSats = z.number({ error: changeSatsError }).int({ error: changeSatsError }).min(-MAX_SATS, { error: changeSatsError }).max(MAX_SATS, { error: changeSatsError })
export const ManualBalanceChangeInputSchema = z.object({
  mode: z.enum(['set', 'add'], { error: 'The change must set or add to the balance' }),
  sats: changeSats,
  comment: z.string({ error: 'The comment must be text' })
    .trim()
    .max(MAX_COMMENT_LENGTH, { error: `The comment can be at most ${MAX_COMMENT_LENGTH} characters` })
    .nullish()
    .transform(comment => comment || null),
}).refine(change => change.mode === 'add' || change.sats >= 0, { error: 'The balance cannot go below zero', path: ['sats'] })

// SQLite schema for the user store. Keep in sync with the CREATE TABLE in
// e2e/seed-test-db.mjs (the e2e seeder is standalone and cannot import this
// module).
export const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    access_key TEXT NOT NULL UNIQUE,
    lnbits_url TEXT NOT NULL,
    lnbits_invoice_key TEXT NOT NULL,
    owner TEXT NOT NULL DEFAULT '',
    balance_source TEXT NOT NULL DEFAULT 'lnbits',
    manual_sats INTEGER,
    manual_changed_at INTEGER,
    manual_change_sats INTEGER,
    manual_change_comment TEXT
  )
`

// Columns added after the first release, with the definition used to backfill
// older databases. New DBs get them via CREATE_USERS_TABLE.
const ADDED_USER_COLUMNS: Record<string, string> = {
  owner: `TEXT NOT NULL DEFAULT ''`,
  balance_source: `TEXT NOT NULL DEFAULT 'lnbits'`,
  manual_sats: 'INTEGER',
  manual_changed_at: 'INTEGER',
  manual_change_sats: 'INTEGER',
  manual_change_comment: 'TEXT',
}

/** Brings an existing users table up to the current schema (idempotent). */
export const migrateUsersTable = (db: DatabaseSync): void => {
  const columns = new Set((db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>).map(c => c.name))
  for (const [name, definition] of Object.entries(ADDED_USER_COLUMNS)) {
    // Names and definitions are the constants above (PRAGMA/DDL can't be parameterised).
    if (!columns.has(name)) db.exec(`ALTER TABLE users ADD COLUMN ${name} ${definition}`)
  }
}

// Key/value store for admin settings (e.g. the default LNBits URL).
export const CREATE_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`

export interface UserRow {
  id: string
  name: string
  access_key: string
  lnbits_url: string
  lnbits_invoice_key: string
  balance_source: string
  manual_sats: number | null
  manual_changed_at: number | null
  manual_change_sats: number | null
  manual_change_comment: string | null
}

const rowToBalance = (row: UserRow): Balance => BalanceSchema.parse(row.balance_source === 'manual'
  ? {
      source: 'manual',
      sats: row.manual_sats,
      lastChange: row.manual_changed_at === null
        ? null
        : {
            time: row.manual_changed_at,
            sats: row.manual_change_sats,
            comment: row.manual_change_comment,
          },
    }
  : { source: row.balance_source })

export const rowToUser = (row: UserRow): UserSchema => ({
  id: row.id,
  name: row.name,
  accessKey: row.access_key,
  lnbits: {
    url: row.lnbits_url,
    invoiceKey: row.lnbits_invoice_key,
  },
  balance: rowToBalance(row),
})

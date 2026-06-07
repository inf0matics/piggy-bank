import { z } from 'zod'

const LnBitsSchema = z.object({
  url: z.string(),
  invoiceKey: z.string(),
})

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  accessKey: z.string(),
  lnbits: LnBitsSchema,
})

export type UserSchema = z.infer<typeof UserSchema>

// Fields the admin UI submits when creating/editing a piggy bank (no id — it is
// generated on insert).
export const UserInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  accessKey: z.string().trim().min(1, 'PIN is required'),
  lnbitsUrl: z.string().trim().url('A valid LNBits URL is required'),
  invoiceKey: z.string().trim().min(1, 'Invoice key is required'),
})

export type UserInput = z.infer<typeof UserInputSchema>

// SQLite schema for the user store. Keep in sync with the CREATE TABLE in
// e2e/seed-test-db.mjs (the e2e seeder is standalone and cannot import this
// module).
export const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    access_key TEXT NOT NULL UNIQUE,
    lnbits_url TEXT NOT NULL,
    lnbits_invoice_key TEXT NOT NULL
  )
`

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
}

export const rowToUser = (row: UserRow): UserSchema => ({
  id: row.id,
  name: row.name,
  accessKey: row.access_key,
  lnbits: {
    url: row.lnbits_url,
    invoiceKey: row.lnbits_invoice_key,
  },
})

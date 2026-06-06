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

// SQLite schema for the user store. Keep in sync with the CREATE TABLE in
// scripts/migrate-config-to-sqlite.mjs (the migration script is standalone and
// cannot import this module).
export const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    access_key TEXT NOT NULL UNIQUE,
    lnbits_url TEXT NOT NULL,
    lnbits_invoice_key TEXT NOT NULL
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

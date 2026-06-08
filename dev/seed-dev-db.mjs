// Seeds the local dev SQLite DB with a few piggy banks owned by the dev-login
// identity (`e2e-admin`), pointed at the LNBits mock so the admin list shows
// live LNURL-p status + balance. Run automatically by docker-compose.dev.yml
// before `nuxt dev` starts; can also be run on the host:
//   node dev/seed-dev-db.mjs
//
// Schema mirrors CREATE_USERS_TABLE in server/domain/user.ts.
import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const dbPath = path.resolve(process.env.DATABASE_PATH || 'data/piggy-bank.db')
fs.mkdirSync(path.dirname(dbPath), { recursive: true })

// In the dev compose the app reaches the mock at http://lnbits-mock (Docker
// network). On the host (no compose) override with LNBITS_MOCK_URL.
const MOCK = process.env.LNBITS_MOCK_URL || 'http://lnbits-mock'
const OWNER = 'e2e-admin'

const db = new DatabaseSync(dbPath)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    access_key TEXT NOT NULL UNIQUE,
    lnbits_url TEXT NOT NULL,
    lnbits_invoice_key TEXT NOT NULL,
    owner TEXT NOT NULL DEFAULT ''
  )
`)

const upsert = db.prepare(`
  INSERT OR REPLACE INTO users (id, name, access_key, lnbits_url, lnbits_invoice_key, owner)
  VALUES (?, ?, ?, ?, ?, ?)
`)

const rows = [
  // Active LNURL-p (the mock serves a link for any key except `no-lnurlp-key`).
  ['dev-alice', 'Alice', '0000', MOCK, 'alice-invoice-key', OWNER],
  ['dev-bob', 'Bob', '1234', MOCK, 'bob-invoice-key', OWNER],
  // Inactive: the mock returns no LNURL-p links for this invoice key.
  ['dev-carol', 'Carol', '5678', MOCK, 'no-lnurlp-key', OWNER],
]
for (const r of rows) upsert.run(...r)

db.close()
console.log(`[dev seed] ${rows.length} piggy banks (owner=${OWNER}) -> ${MOCK} in ${dbPath}`)

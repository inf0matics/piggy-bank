// Seeds the e2e SQLite database with the test user, then exits. Mounted into
// the app container and run before the server starts (see docker-compose.e2e.yml).
// The PIN (0000) matches what the specs type on the keypad.
//
// Keep the schema in sync with CREATE_USERS_TABLE in server/domain/user.ts.
import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const dbPath = path.resolve(process.env.DATABASE_PATH || 'data/piggy-bank.db')
fs.mkdirSync(path.dirname(dbPath), { recursive: true })

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
// Owner 'e2e-admin' matches the auth-shim identity, so these are visible in the
// admin UI. Primary login user — its mock wallet exposes an LNURL-p ("active").
upsert.run('test-user', 'Test', '0000', 'http://lnbits-mock', 'test-invoice-key', 'e2e-admin')
// Second user whose invoice key makes the mock return no LNURL-p links, so the
// admin list can assert the "inactive" badge. (See e2e/mocks/lnbits/server.mjs.)
// PIN avoids 1111 — auth.spec.ts uses that as its "wrong PIN".
upsert.run('no-lnurlp-user', 'Nolnurlp', '2222', 'http://lnbits-mock', 'no-lnurlp-key', 'e2e-admin')
// Owned by a different custodian — must NOT appear in the e2e-admin's list
// (proves per-custodian isolation). Still works for PIN login (login is global).
upsert.run('other-owner-user', 'Foreign', '3333', 'http://lnbits-mock', 'test-invoice-key', 'other-custodian')

// A default-LNBits-URL under the un-scoped key. Settings are now per-custodian
// (key `default_lnbits_url:<sub>`), so the e2e-admin must NOT see this value —
// it guards against regressing to a global setting.
db.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`)
db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
  .run('default_lnbits_url', 'http://foreign-default.example')

db.close()

console.log(`[e2e seed] test users ready in ${dbPath}`)

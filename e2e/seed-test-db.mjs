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
    lnbits_invoice_key TEXT NOT NULL
  )
`)
db.prepare(`
  INSERT OR REPLACE INTO users (id, name, access_key, lnbits_url, lnbits_invoice_key)
  VALUES (?, ?, ?, ?, ?)
`).run('test-user', 'Test', '0000', 'http://lnbits-mock', 'test-invoice-key')
db.close()

console.log(`[e2e seed] test user ready in ${dbPath}`)

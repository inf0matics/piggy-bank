// One-time migration: import users from a config.json into the SQLite store.
//
// Self-contained on purpose — it uses only Node built-ins so it can run both on
// the host and inside the runtime container image (which ships only `.output`,
// not the app source). Idempotent: re-running upserts by user id.
//
//   CONFIG_PATH=config.json DATABASE_PATH=data/piggy-bank.db \
//     node scripts/migrate-config-to-sqlite.mjs
//
import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

// Keep in sync with CREATE_USERS_TABLE in server/domain/user.ts.
const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    access_key TEXT NOT NULL UNIQUE,
    lnbits_url TEXT NOT NULL,
    lnbits_invoice_key TEXT NOT NULL
  )
`

const configPath = path.resolve(process.env.CONFIG_PATH || 'config.json')
const dbPath = path.resolve(process.env.DATABASE_PATH || 'data/piggy-bank.db')

const fail = (message) => {
  console.error(`[migrate] ${message}`)
  process.exit(1)
}

if (!fs.existsSync(configPath)) {
  fail(`config file not found: ${configPath}`)
}

let config
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
} catch (error) {
  fail(`could not parse ${configPath}: ${error.message}`)
}

const users = Array.isArray(config?.users) ? config.users : []
if (users.length === 0) {
  console.warn(`[migrate] no users found in ${configPath}; nothing to import`)
}

fs.mkdirSync(path.dirname(dbPath), { recursive: true })
const db = new DatabaseSync(dbPath)
db.exec(CREATE_USERS_TABLE)

const upsert = db.prepare(`
  INSERT OR REPLACE INTO users (id, name, access_key, lnbits_url, lnbits_invoice_key)
  VALUES (?, ?, ?, ?, ?)
`)

let imported = 0
for (const user of users) {
  if (!user?.id || !user?.name || !user?.accessKey || !user?.lnbits?.url || !user?.lnbits?.invoiceKey) {
    console.warn(`[migrate] skipping invalid user entry: ${JSON.stringify(user)}`)
    continue
  }
  upsert.run(user.id, user.name, user.accessKey, user.lnbits.url, user.lnbits.invoiceKey)
  imported += 1
  console.log(`[migrate] imported user "${user.name}" (id=${user.id})`)
}

db.close()
console.log(`[migrate] done — ${imported} user(s) written to ${dbPath}`)

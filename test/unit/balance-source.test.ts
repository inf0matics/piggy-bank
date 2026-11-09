// A piggy bank's balance comes from LNBits or is held manually (spec admin-10).
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { describe, it } from 'node:test'
import {
  CREATE_USERS_TABLE,
  ManualSwitchInputSchema,
  migrateUsersTable,
  rowToUser,
  type UserRow,
} from '../../server/domain/user.ts'

// The users table as it was before balance sources existed.
const LEGACY_USERS_TABLE = `
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    access_key TEXT NOT NULL UNIQUE,
    lnbits_url TEXT NOT NULL,
    lnbits_invoice_key TEXT NOT NULL
  )
`

const selectRow = (db: DatabaseSync, id: string) =>
  db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as UserRow

describe('users table migration', () => {
  it('puts existing piggy banks on LNBits and keeps their LNBits config', () => {
    const db = new DatabaseSync(':memory:')
    db.exec(LEGACY_USERS_TABLE)
    db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?)').run('a', 'Anna', '1234', 'http://lnbits', 'key')

    migrateUsersTable(db)

    const user = rowToUser(selectRow(db, 'a'))
    assert.deepEqual(user.balance, { source: 'lnbits' })
    assert.deepEqual(user.lnbits, { url: 'http://lnbits', invoiceKey: 'key' })
  })

  it('upgrades a table that already has owners (the deployed schema)', () => {
    const db = new DatabaseSync(':memory:')
    db.exec(LEGACY_USERS_TABLE)
    db.exec(`ALTER TABLE users ADD COLUMN owner TEXT NOT NULL DEFAULT ''`)
    db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)').run('a', 'Anna', '1234', 'http://lnbits', 'key', 'sub-1')

    migrateUsersTable(db)

    const row = selectRow(db, 'a') as UserRow & { owner: string }
    assert.equal(row.owner, 'sub-1')
    assert.deepEqual(rowToUser(row).balance, { source: 'lnbits' })
  })

  it('is idempotent and leaves a current table unchanged', () => {
    const db = new DatabaseSync(':memory:')
    db.exec(CREATE_USERS_TABLE)
    const columns = () => db.prepare('PRAGMA table_info(users)').all().map(c => c.name)
    const before = columns()

    migrateUsersTable(db)
    migrateUsersTable(db)

    assert.deepEqual(columns(), before)
  })
})

describe('rowToUser', () => {
  const lnbitsRow: UserRow = {
    id: 'a',
    name: 'Anna',
    access_key: '1234',
    lnbits_url: 'http://lnbits',
    lnbits_invoice_key: 'key',
    balance_source: 'lnbits',
    manual_sats: null,
    manual_changed_at: null,
    manual_change_sats: null,
    manual_change_comment: null,
  }

  it('maps a manual piggy bank with its balance and last change', () => {
    const user = rowToUser({
      ...lnbitsRow,
      balance_source: 'manual',
      manual_sats: 98_765,
      manual_changed_at: 1_700_000_000,
      manual_change_sats: 98_765,
      manual_change_comment: 'Frozen',
    })
    assert.deepEqual(user.balance, {
      source: 'manual',
      sats: 98_765,
      lastChange: { time: 1_700_000_000, sats: 98_765, comment: 'Frozen' },
    })
    // Kept for switching back to LNBits later.
    assert.deepEqual(user.lnbits, { url: 'http://lnbits', invoiceKey: 'key' })
  })

  it('ignores leftover manual columns on an LNBits piggy bank', () => {
    const user = rowToUser({ ...lnbitsRow, manual_sats: 5, manual_changed_at: 1, manual_change_sats: 5 })
    assert.deepEqual(user.balance, { source: 'lnbits' })
  })

  it('rejects a manual row without a balance', () => {
    assert.throws(() => rowToUser({ ...lnbitsRow, balance_source: 'manual' }))
  })
})

describe('ManualSwitchInputSchema', () => {
  const message = (input: unknown) => {
    const result = ManualSwitchInputSchema.safeParse(input)
    assert.equal(result.success, false)
    return result.error?.issues[0]?.message
  }

  it('accepts a whole, non-negative number of sats', () => {
    assert.deepEqual(ManualSwitchInputSchema.parse({ sats: 0 }), { sats: 0 })
    assert.deepEqual(ManualSwitchInputSchema.parse({ sats: 100_000 }), { sats: 100_000 })
  })

  it('rejects anything else with one message', () => {
    for (const sats of [-1, 1.5, '100', null, Number.NaN, Infinity, 3e15]) {
      assert.equal(message({ sats }), 'The starting balance must be a whole number of sats, 0 or more', String(sats))
    }
    assert.equal(message({}), 'The starting balance must be a whole number of sats, 0 or more')
    assert.equal(ManualSwitchInputSchema.safeParse(undefined).success, false)
  })
})

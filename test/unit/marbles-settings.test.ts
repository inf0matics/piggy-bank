// Each piggy bank stores its own marbles connection (spec admin-13): URL, API
// key and wallet id, next to the LNBits URL and key.
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { describe, it } from 'node:test'
import {
  CREATE_USERS_TABLE,
  MarblesSettingsSchema,
  MarblesSwitchInputSchema,
  migrateUsersTable,
  rowToUser,
  UserInputSchema,
  type UserRow,
} from '../../server/domain/user.ts'
import { checkKeyFor } from '../../server/utils/Marbles.ts'

const KEY = `mbl_${'Ab0_-'.repeat(8)}xyz`
const WALLET = 'Wa1LeTxQ0pBc9dZr'

const base = { name: 'Anna', accessKey: '1234', lnbitsUrl: 'https://lnbits.example.com', invoiceKey: 'inv' }
const marbles = { marblesUrl: 'https://marbles.example.com', marblesKey: KEY, marblesWallet: WALLET }

const firstMessage = (input: unknown) => {
  const result = UserInputSchema.safeParse(input)
  assert.equal(result.success, false, JSON.stringify(input))
  return result.error?.issues[0]?.message
}

describe('UserInputSchema with marbles settings', () => {
  it('has no marbles connection without key and wallet, even with the default URL filled in', () => {
    assert.equal(UserInputSchema.parse(base).marbles, null)
    assert.equal(UserInputSchema.parse({ ...base, marblesUrl: 'https://marbles.example.com', marblesKey: ' ', marblesWallet: '' }).marbles, null)
    assert.equal(UserInputSchema.parse({ ...base, marblesUrl: null, marblesKey: null, marblesWallet: null }).marbles, null)
  })

  it('stores URL, key and wallet, trimmed, the URL without a trailing slash', () => {
    const input = UserInputSchema.parse({ ...base, marblesUrl: ' https://marbles.example.com/ ', marblesKey: ` ${KEY} `, marblesWallet: ` ${WALLET} ` })
    assert.deepEqual(input.marbles, { url: 'https://marbles.example.com', key: KEY, wallet: WALLET })
    assert.equal(UserInputSchema.parse({ ...base, ...marbles, marblesUrl: 'http://marbles-mock:8080/sub/' }).marbles?.url, 'http://marbles-mock:8080/sub')
  })

  it('needs all three once a key or a wallet is given', () => {
    assert.equal(firstMessage({ ...base, ...marbles, marblesUrl: '' }), 'A valid marbles URL is required')
    assert.equal(firstMessage({ ...base, ...marbles, marblesKey: '' }), 'The marbles API key is mbl_ followed by 43 characters')
    assert.equal(firstMessage({ ...base, ...marbles, marblesWallet: '' }), 'The marbles wallet id is 16 characters')
  })

  it('refuses a URL the app could not call <URL>/api/v1 on safely', () => {
    for (const marblesUrl of ['marbles.example.com', 'ftp://marbles.example.com', 'javascript:alert(1)', 'https://user:pw@marbles.example.com', 'https://marbles.example.com/?a=1', 'https://marbles.example.com/#x']) {
      assert.equal(firstMessage({ ...base, ...marbles, marblesUrl }), 'A valid marbles URL is required', marblesUrl)
    }
  })

  it('refuses keys and wallet ids that are not marbles ones (no header or path injection)', () => {
    for (const marblesKey of ['mbl_short', `mbl_${'a'.repeat(44)}`, `MBL_${'a'.repeat(43)}`, `mbl_${'a'.repeat(42)}\n`, `mbl_${'a'.repeat(42)}é`]) {
      assert.equal(firstMessage({ ...base, ...marbles, marblesKey }), 'The marbles API key is mbl_ followed by 43 characters', JSON.stringify(marblesKey))
    }
    for (const marblesWallet of ['../../key/xxxxxx', 'Wa1LeTxQ0pBc9dZ', 'Wa1LeTxQ0pBc9dZr0', 'Wa1LeTxQ0pBc9d%2', 'Wa1LeTxQ0pBc9d/r']) {
      assert.equal(firstMessage({ ...base, ...marbles, marblesWallet }), 'The marbles wallet id is 16 characters', marblesWallet)
    }
  })

  it('still reports the base fields first', () => {
    assert.equal(firstMessage({ ...base, ...marbles, name: '' }), 'Name is required')
  })
})

describe('MarblesSettingsSchema (test connection)', () => {
  it('takes the three settings as a connection', () => {
    assert.deepEqual(MarblesSettingsSchema.parse(marbles), { url: 'https://marbles.example.com', key: KEY, wallet: WALLET })
    assert.equal(MarblesSettingsSchema.safeParse({ ...marbles, marblesKey: '' }).success, false)
    assert.equal(MarblesSettingsSchema.safeParse(null).success, false)
  })
})

describe('MarblesSwitchInputSchema', () => {
  it('takes the two balances the custodian compared, in whole sats', () => {
    assert.deepEqual(MarblesSwitchInputSchema.parse({ manualSats: 0, marblesSats: 150_000 }), { manualSats: 0, marblesSats: 150_000 })
    for (const input of [{}, { manualSats: 1 }, { manualSats: 1, marblesSats: -1 }, { manualSats: 1, marblesSats: 1.5 }, { manualSats: 1, lnbitsSats: 1 }]) {
      assert.equal(MarblesSwitchInputSchema.safeParse(input).success, false, JSON.stringify(input))
    }
  })
})

describe('users table with marbles settings', () => {
  const row = (fields: Partial<UserRow>): UserRow => ({
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
    marbles_url: null,
    marbles_key: null,
    marbles_wallet: null,
    ...fields,
  })

  it('adds the marbles columns to an existing table, keeping the rows', () => {
    const db = new DatabaseSync(':memory:')
    db.exec(CREATE_USERS_TABLE.replace(/,\s*marbles_url[^)]*/, '\n'))
    assert.equal(db.prepare('PRAGMA table_info(users)').all().some(c => c.name === 'marbles_url'), false)
    db.prepare('INSERT INTO users (id, name, access_key, lnbits_url, lnbits_invoice_key) VALUES (?, ?, ?, ?, ?)').run('a', 'Anna', '1234', 'http://lnbits', 'key')

    migrateUsersTable(db)

    const user = rowToUser(db.prepare('SELECT * FROM users WHERE id = ?').get('a') as unknown as UserRow)
    assert.equal(user.marbles, null)
    assert.deepEqual(user.balance, { source: 'lnbits' })
  })

  it('reads the marbles connection and the marbles source', () => {
    const user = rowToUser(row({ balance_source: 'marbles', marbles_url: 'https://m', marbles_key: KEY, marbles_wallet: WALLET }))
    assert.deepEqual(user.marbles, { url: 'https://m', key: KEY, wallet: WALLET })
    assert.deepEqual(user.balance, { source: 'marbles' })
    assert.deepEqual(user.lnbits, { url: 'http://lnbits', invoiceKey: 'key' })
  })
})

describe('checkKeyFor (test connection)', () => {
  const key = (rights: string[], wallets = [{ id: WALLET, name: 'Anna' }]) => ({ wallets, rights, expiresAt: null })

  it('accepts a key that reaches the wallet with read and pay_links', () => {
    assert.deepEqual(checkKeyFor(key(['read', 'pay_links']), WALLET), { ok: true, walletName: 'Anna', riskyRights: [] })
  })

  it('names the rights that can move money out of the wallet', () => {
    assert.deepEqual(checkKeyFor(key(['read', 'pay_links', 'pay', 'withdraw_links', 'receive', 'teleport']), WALLET), {
      ok: true,
      walletName: 'Anna',
      riskyRights: ['pay', 'withdraw_links'],
    })
  })

  it('refuses a key without the wallet or without a needed right', () => {
    assert.deepEqual(checkKeyFor(key(['read', 'pay_links'], [{ id: 'OtherWallet00001', name: 'Bob' }]), WALLET), {
      ok: false,
      error: 'The API key does not reach this wallet. Check the wallet id, or add the wallet to the key in marbles.',
    })
    assert.deepEqual(checkKeyFor(key(['read']), WALLET), {
      ok: false,
      error: 'The API key lacks the right pay_links. The piggy bank needs read and pay_links.',
    })
    assert.deepEqual(checkKeyFor(key(['receive']), WALLET), {
      ok: false,
      error: 'The API key lacks the rights read and pay_links. The piggy bank needs read and pay_links.',
    })
  })
})

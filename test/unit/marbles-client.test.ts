// marbles as a balance source (spec admin-13): the app reads a wallet's
// balance, last payment and deposit link from the marbles API v1, caches the
// reads, and maps every answer onto the states the app already knows.
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import {
  MarblesError,
  readDeposit,
  readKey,
  readLastPayment,
  readMarblesWalletSats,
  readWallet,
  resetMarblesCache,
} from '../../server/utils/Marbles.ts'

const KEY = `mbl_${'a'.repeat(43)}`
const conn = { url: 'https://marbles.test', key: KEY, wallet: 'Wa1LeTxQ0pBc9dZr' }

interface Call { url: string, init: RequestInit | undefined }

// Answers each request with the next handler's response and records it.
let calls: Call[] = []
const realFetch = globalThis.fetch
const answer = (...responses: Array<() => Response | Promise<Response>>) => {
  let i = 0
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), init })
    const next = responses[Math.min(i++, responses.length - 1)]!
    return next()
  }
}
const json = (status: number, body: unknown, headers: Record<string, string> = {}) => () =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })
const marblesError = (status: number, code: string, headers: Record<string, string> = {}) =>
  json(status, { error: { code, message: 'for people' } }, headers)

const wallet = (balance_msat: unknown) => ({
  id: conn.wallet,
  name: 'Anna',
  balance_msat,
  in_flight_msat: '0',
  status: 'active',
  some_future_field: { ignored: true },
})

const transaction = (fields: Record<string, unknown> = {}) => ({
  id: 'Tx2bQf0cJm4nE1Ab',
  kind: 'lnurl-pay',
  status: 'settled',
  direction: 'in',
  amount_msat: '2100000',
  amount_paid_msat: '2100999',
  description: 'Piggy bank',
  settled_at: '2026-11-11T20:15:00.000Z',
  lnurl_params: { link: 'Lk', comment: 'Happy birthday' },
  ...fields,
})

const payLink = (fields: Record<string, unknown> = {}) => ({
  id: 'Lk3fQ0pBc9dZrWa1LeTxQ0pBc9dZrWa1LeTxQ0pBc9d',
  active: true,
  lnurl: 'LNURL1NEWEST',
  address: 'anna@marbles.test',
  ...fields,
})

const rejectsWith = (promise: Promise<unknown>, reason: string) =>
  assert.rejects(promise, (error: unknown) => error instanceof MarblesError && error.reason === reason)

beforeEach(() => {
  calls = []
  resetMarblesCache()
})
afterEach(() => {
  globalThis.fetch = realFetch
})

describe('marbles requests', () => {
  it('calls <URL>/api/v1 with the key as a bearer token', async () => {
    answer(json(200, wallet('0')))
    await readWallet(conn)
    assert.equal(calls[0]!.url, `https://marbles.test/api/v1/wallets/${conn.wallet}`)
    assert.equal(new Headers(calls[0]!.init?.headers).get('authorization'), `Bearer ${KEY}`)
  })

  it('sends only documented query parameters', async () => {
    answer(json(200, { transactions: [], next_cursor: null }), json(200, { pay_links: [] }), json(200, { wallets: [], rights: [], expires_at: null }))
    await readLastPayment(conn)
    await readDeposit(conn)
    await readKey(conn)
    assert.deepEqual(calls.map(c => c.url), [
      `https://marbles.test/api/v1/wallets/${conn.wallet}/transactions?limit=1&status=settled`,
      `https://marbles.test/api/v1/wallets/${conn.wallet}/pay-links`,
      'https://marbles.test/api/v1/key',
    ])
  })
})

describe('readWallet', () => {
  it('reads the balance in whole sats, rounded down, and the wallet name', async () => {
    answer(json(200, wallet('150000999')))
    assert.deepEqual(await readWallet(conn), { name: 'Anna', sats: 150_000 })
  })

  it('reads balances beyond the float-safe msat range exactly', async () => {
    answer(json(200, wallet('2100000000000000000')))
    assert.equal((await readWallet(conn)).sats, 2_100_000_000_000_000)
  })

  it('refuses a balance that is not an msat integer string as malformed', async () => {
    for (const balance of [150_000, '21.0', '2.1e1', '-1', '', ' 1', null, '01']) {
      resetMarblesCache()
      answer(json(200, wallet(balance)))
      await rejectsWith(readWallet(conn), 'malformed')
    }
  })
})

describe('readLastPayment', () => {
  const last = async (fields: Record<string, unknown>) => {
    resetMarblesCache()
    answer(json(200, { transactions: [transaction(fields)], next_cursor: 'c' }))
    return readLastPayment(conn)
  }

  it('takes the paid amount, the payer comment and the settle time', async () => {
    assert.deepEqual(await last({}), { sats: 2_100, comment: 'Happy birthday', time: Date.parse('2026-11-11T20:15:00.000Z') / 1000 })
  })

  it('falls back to the asked amount and the description', async () => {
    assert.deepEqual(await last({ amount_paid_msat: null, lnurl_params: null, description: 'Top up' }), {
      sats: 2_100, comment: 'Top up', time: Date.parse('2026-11-11T20:15:00.000Z') / 1000,
    })
  })

  it('counts an outgoing transaction as negative', async () => {
    assert.equal((await last({ direction: 'out', amount_paid_msat: null }))?.sats, -2_100)
  })

  it('shows an operator adjustment like any payment, with its note', async () => {
    const change = await last({ kind: 'operator-credit', amount_paid_msat: null, lnurl_params: null, description: 'Start balance' })
    assert.deepEqual(change && { sats: change.sats, comment: change.comment }, { sats: 2_100, comment: 'Start balance' })
  })

  it('ignores kinds and statuses it does not know', async () => {
    assert.equal((await last({ kind: 'teleport', status: 'whatever' }))?.sats, 2_100)
  })

  it('has no comment when there is none', async () => {
    assert.equal((await last({ lnurl_params: { link: 'Lk' }, description: null }))?.comment, null)
  })

  it('is null for a wallet without settled transactions', async () => {
    answer(json(200, { transactions: [], next_cursor: null }))
    assert.equal(await readLastPayment(conn), null)
  })

  it('refuses malformed amounts and times', async () => {
    for (const fields of [{ amount_paid_msat: 2100 }, { amount_msat: '1.5', amount_paid_msat: null }, { settled_at: null }, { settled_at: 'yesterday' }]) {
      resetMarblesCache()
      answer(json(200, { transactions: [transaction(fields)], next_cursor: null }))
      await rejectsWith(readLastPayment(conn), 'malformed')
    }
  })
})

describe('readDeposit', () => {
  it('takes the newest active pay link', async () => {
    answer(json(200, { pay_links: [payLink({ active: false, lnurl: 'LNURL1OFF' }), payLink(), payLink({ lnurl: 'LNURL1OLDER' })] }))
    assert.deepEqual(await readDeposit(conn), { lnurl: 'LNURL1NEWEST', address: 'anna@marbles.test' })
  })

  it('is null without an active link, or without a public URL on marbles (lnurl null)', async () => {
    answer(json(200, { pay_links: [payLink({ active: false })] }))
    assert.equal(await readDeposit(conn), null)
    resetMarblesCache()
    answer(json(200, { pay_links: [payLink({ lnurl: null })] }))
    assert.equal(await readDeposit(conn), null)
  })

  it('is null when the key lacks the pay_links right (403)', async () => {
    answer(marblesError(403, 'forbidden'))
    assert.equal(await readDeposit(conn), null)
  })
})

describe('marbles answers mapped to states', () => {
  it('network errors, 5xx (busy included) and non-JSON answers are unreachable', async () => {
    const failures = [
      () => { throw new TypeError('fetch failed') },
      marblesError(503, 'busy'),
      marblesError(500, 'internal_error'),
      () => new Response('<html>Bad gateway</html>', { status: 200, headers: { 'Content-Type': 'text/html' } }),
      () => new Response('not json', { status: 200, headers: { 'Content-Type': 'application/json' } }),
    ]
    for (const failure of failures) {
      resetMarblesCache()
      answer(failure)
      await rejectsWith(readWallet(conn), 'unreachable')
    }
  })

  it('an unknown key or a wallet it does not reach is refused, an expired key is expired', async () => {
    answer(marblesError(401, 'unauthorized'))
    await rejectsWith(readWallet(conn), 'refused')
    resetMarblesCache()
    answer(marblesError(404, 'not_found'))
    await rejectsWith(readWallet(conn), 'refused')
    resetMarblesCache()
    answer(marblesError(401, 'key_expired'))
    await rejectsWith(readWallet(conn), 'expired')
  })

  it('maps the switch reads onto the wallet read of admin-12', async () => {
    answer(json(200, wallet('5000')))
    assert.deepEqual(await readMarblesWalletSats(conn), { sats: 5 })
    for (const [failure, reason] of [
      [marblesError(503, 'busy'), 'unreachable'],
      [marblesError(401, 'unauthorized'), 'refused'],
      [marblesError(401, 'key_expired'), 'expired'],
      [json(200, wallet(5)), 'refused'],
    ] as const) {
      resetMarblesCache()
      answer(failure)
      assert.deepEqual(await readMarblesWalletSats(conn), { sats: null, reason })
    }
  })
})

describe('rate limit', () => {
  it('a 429 is unreachable, and the key is not asked again before Retry-After', async (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: 1_000_000 })
    answer(marblesError(429, 'rate_limited', { 'Retry-After': '30' }), json(200, wallet('1000')))
    await rejectsWith(readWallet(conn), 'unreachable')

    // Every read with that key waits, cached or not, and the other wallet too.
    t.mock.timers.setTime(1_000_000 + 29_000)
    await rejectsWith(readWallet(conn, { fresh: true }), 'unreachable')
    await rejectsWith(readDeposit({ ...conn, wallet: 'OtherWallet00001' }), 'unreachable')
    await rejectsWith(readKey(conn), 'unreachable')
    assert.equal(calls.length, 1)

    // Another key is not held back.
    answer(json(200, wallet('1000')))
    assert.equal((await readWallet({ ...conn, key: `mbl_${'b'.repeat(43)}` })).sats, 1)

    t.mock.timers.setTime(1_000_000 + 30_000)
    assert.equal((await readWallet(conn, { fresh: true })).sats, 1)
  })

  it('waits a minute when Retry-After is missing or unreadable', async (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: 1_000_000 })
    answer(marblesError(429, 'rate_limited'), json(200, wallet('1000')))
    await rejectsWith(readWallet(conn), 'unreachable')
    t.mock.timers.setTime(1_000_000 + 59_000)
    await rejectsWith(readWallet(conn, { fresh: true }), 'unreachable')
    t.mock.timers.setTime(1_000_000 + 60_000)
    assert.equal((await readWallet(conn, { fresh: true })).sats, 1)
  })
})

describe('cache', () => {
  it('concurrent callers share one fetch', async () => {
    answer(json(200, wallet('1000')))
    const reads = await Promise.all([readWallet(conn), readWallet(conn), readWallet(conn)])
    assert.deepEqual(reads.map(r => r.sats), [1, 1, 1])
    assert.equal(calls.length, 1)
  })

  it('keeps balance and last payment for a few seconds, pay links for longer', async (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: 1_000_000 })
    answer(json(200, wallet('1000')), json(200, { transactions: [], next_cursor: null }), json(200, { pay_links: [payLink()] }))
    await readWallet(conn)
    await readLastPayment(conn)
    await readDeposit(conn)
    assert.equal(calls.length, 3)

    t.mock.timers.setTime(1_000_000 + 4_000)
    await Promise.all([readWallet(conn), readLastPayment(conn), readDeposit(conn)])
    assert.equal(calls.length, 3)

    answer(json(200, wallet('2000')), json(200, { transactions: [], next_cursor: null }))
    t.mock.timers.setTime(1_000_000 + 5_000)
    assert.equal((await readWallet(conn)).sats, 2)
    await readLastPayment(conn)
    await readDeposit(conn)
    assert.equal(calls.length, 5)

    answer(json(200, { pay_links: [] }))
    t.mock.timers.setTime(1_000_000 + 60_000)
    assert.equal(await readDeposit(conn), null)
    assert.equal(calls.length, 6)
  })

  it('caches per wallet and key: another key never reads a cached answer', async () => {
    answer(json(200, wallet('1000')), marblesError(401, 'unauthorized'))
    await readWallet(conn)
    await rejectsWith(readWallet({ ...conn, key: `mbl_${'c'.repeat(43)}` }), 'refused')
  })

  it('a fresh read asks marbles and updates the cache', async () => {
    answer(json(200, wallet('1000')), json(200, wallet('2000')))
    await readWallet(conn)
    assert.equal((await readWallet(conn, { fresh: true })).sats, 2)
    assert.equal((await readWallet(conn)).sats, 2)
    assert.equal(calls.length, 2)
  })
})

describe('readKey', () => {
  it('reads the wallets, rights and expiry, keeping rights it does not know', async () => {
    answer(json(200, {
      label: 'piggy',
      wallets: [{ id: conn.wallet, name: 'Anna' }],
      rights: ['read', 'pay_links', 'teleport'],
      created_at: '2026-11-11T20:15:00.000Z',
      expires_at: null,
      api_version: '1.0',
    }))
    assert.deepEqual(await readKey(conn), { wallets: [{ id: conn.wallet, name: 'Anna' }], rights: ['read', 'pay_links', 'teleport'], expiresAt: null })
  })
})

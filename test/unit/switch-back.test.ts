// A manual piggy bank goes back on LNBits (spec admin-12) or onto marbles
// (spec admin-13) once the custodian has compared the manual balance with the
// wallet's.
import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { SwitchBackInputSchema } from '../../server/domain/user.ts'
import { readWalletSats } from '../../server/utils/LnBits.ts'
import { checkSwitchBack, WALLET_UNREADABLE } from '../../utils/switchBack.ts'

describe('readWalletSats', () => {
  const realFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = realFetch
  })

  const respondWith = (status: number, body: unknown) => {
    globalThis.fetch = async () => new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const wallet = { url: 'http://lnbits.test', invoiceKey: 'k' }

  it('reads the wallet balance in whole sats', async () => {
    respondWith(200, { balance: 150_000_999 })
    assert.deepEqual(await readWalletSats(wallet), { sats: 150_000 })
  })

  it('says LNBits is unreachable when it does not answer', async () => {
    globalThis.fetch = async () => {
      throw new TypeError('fetch failed')
    }
    assert.deepEqual(await readWalletSats(wallet), { sats: null, reason: 'unreachable' })
  })

  it('says LNBits refused the key when it answers with an error', async () => {
    respondWith(401, { detail: 'Invalid key' })
    assert.deepEqual(await readWalletSats(wallet), { sats: null, reason: 'refused' })
  })

  it('does not take an answer without a balance as one', async () => {
    for (const body of [{}, { balance: 'lots' }, { balance: null }]) {
      respondWith(200, body)
      assert.deepEqual(await readWalletSats(wallet), { sats: null, reason: 'refused' }, JSON.stringify(body))
    }
  })
})

describe('checkSwitchBack', () => {
  const confirmed = { manualSats: 100_000, walletSats: 150_000 }

  it('allows the switch the custodian confirmed, equal or not', () => {
    assert.equal(checkSwitchBack('lnbits', { manualSats: 100_000, wallet: { sats: 150_000 } }, confirmed), null)
    assert.equal(checkSwitchBack('marbles', { manualSats: 5, wallet: { sats: 5 } }, { manualSats: 5, walletSats: 5 }), null)
  })

  it('refuses while LNBits cannot give its balance, and says why', () => {
    assert.deepEqual(checkSwitchBack('lnbits', { manualSats: 100_000, wallet: { sats: null, reason: 'unreachable' } }, confirmed), {
      statusCode: 503,
      message: WALLET_UNREADABLE.lnbits.unreachable,
    })
    assert.deepEqual(checkSwitchBack('lnbits', { manualSats: 100_000, wallet: { sats: null, reason: 'refused' } }, confirmed), {
      statusCode: 502,
      message: WALLET_UNREADABLE.lnbits.refused,
    })
  })

  it('refuses while marbles cannot give its balance, with its own message for an expired key', () => {
    assert.deepEqual(checkSwitchBack('marbles', { manualSats: 100_000, wallet: { sats: null, reason: 'unreachable' } }, confirmed), {
      statusCode: 503,
      message: 'marbles cannot be reached, so the piggy bank stays manual. Try again later.',
    })
    assert.equal(checkSwitchBack('marbles', { manualSats: 100_000, wallet: { sats: null, reason: 'refused' } }, confirmed)?.statusCode, 502)
    const expired = checkSwitchBack('marbles', { manualSats: 100_000, wallet: { sats: null, reason: 'expired' } }, confirmed)
    assert.equal(expired?.statusCode, 502)
    assert.match(expired?.message ?? '', /^The marbles API key has expired/)
  })

  it('refuses when the balances are not the ones the custodian compared', () => {
    assert.deepEqual(checkSwitchBack('lnbits', { manualSats: 100_000, wallet: { sats: 160_000 } }, confirmed), {
      statusCode: 409,
      message: 'The LNBits balance is now 160,000 sats. Compare the balances again.',
    })
    assert.deepEqual(checkSwitchBack('marbles', { manualSats: 100_000, wallet: { sats: 160_000 } }, confirmed), {
      statusCode: 409,
      message: 'The marbles balance is now 160,000 sats. Compare the balances again.',
    })
    assert.deepEqual(checkSwitchBack('lnbits', { manualSats: 90_000, wallet: { sats: 150_000 } }, confirmed), {
      statusCode: 409,
      message: 'The manual balance has changed. Compare the balances again.',
    })
  })
})

describe('SwitchBackInputSchema', () => {
  it('takes the two balances the custodian compared, in whole sats', () => {
    assert.deepEqual(SwitchBackInputSchema.parse({ manualSats: 0, lnbitsSats: 150_000 }), { manualSats: 0, lnbitsSats: 150_000 })
  })

  it('rejects anything else', () => {
    for (const input of [{}, { manualSats: 1 }, { manualSats: -1, lnbitsSats: 1 }, { manualSats: 1, lnbitsSats: 1.5 }, { manualSats: '1', lnbitsSats: 1 }, { manualSats: 1, lnbitsSats: 3e15 }, null]) {
      assert.equal(SwitchBackInputSchema.safeParse(input).success, false, JSON.stringify(input))
    }
  })
})

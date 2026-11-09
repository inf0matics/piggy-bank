// The BTC/EUR rate may be missing; the app then says so instead of guessing or
// serving an old rate (spec admin-10).
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { after, afterEach, before, describe, it, mock } from 'node:test'
import getKrakenBtcRate, { fetchKrakenBtcRate } from '../../server/utils/getKrakenBtcRate.ts'

const ticker = (rate: string) => ({ error: [], result: { XXBTZEUR: { c: [rate, '1.0'] } } })

describe('fetchKrakenBtcRate', () => {
  // Accepts connections but never answers.
  let hangingServer: Server
  let hangingUrl: string

  before(async () => {
    hangingServer = createServer(() => {})
    await new Promise<void>(resolve => hangingServer.listen(0, '127.0.0.1', resolve))
    hangingUrl = `http://127.0.0.1:${(hangingServer.address() as AddressInfo).port}`
  })

  after(() => {
    hangingServer.closeAllConnections()
    hangingServer.close()
  })

  const realFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = realFetch
  })

  const respondWith = (status: number, body: unknown) => {
    globalThis.fetch = async () => new Response(JSON.stringify(body), { status })
  }

  it('reads the last trade price', async () => {
    respondWith(200, ticker('81000.5'))
    assert.equal(await fetchKrakenBtcRate('http://kraken.test'), 81000.5)
  })

  it('returns null when Kraken answers with an error status', async () => {
    respondWith(503, { error: ['EService:Unavailable'] })
    assert.equal(await fetchKrakenBtcRate('http://kraken.test'), null)
  })

  it('returns null for a malformed or non-positive rate', async () => {
    for (const body of [{ error: ['EQuery:Unknown asset pair'], result: {} }, ticker('abc'), ticker('0'), ticker('-1'), 'nope']) {
      respondWith(200, body)
      assert.equal(await fetchKrakenBtcRate('http://kraken.test'), null, JSON.stringify(body))
    }
  })

  it('returns null when Kraken cannot be reached', async () => {
    globalThis.fetch = async () => {
      throw new TypeError('fetch failed')
    }
    assert.equal(await fetchKrakenBtcRate('http://kraken.test'), null)
  })

  it('gives up on a hung Kraken', async () => {
    const started = Date.now()
    assert.equal(await fetchKrakenBtcRate(hangingUrl, 50), null)
    assert.ok(Date.now() - started < 2_000)
  })
})

describe('getKrakenBtcRate cache', () => {
  const realFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = realFetch
    mock.restoreAll()
  })

  it('serves a fresh rate from cache, but never a stale one when Kraken fails', async () => {
    let now = 1_000_000
    mock.method(Date, 'now', () => now)
    let calls = 0
    globalThis.fetch = async () => {
      calls++
      return new Response(JSON.stringify(ticker('50000')))
    }

    assert.equal(await getKrakenBtcRate(), 50000)
    now += 30_000
    assert.equal(await getKrakenBtcRate(), 50000)
    assert.equal(calls, 1, 'cached within the minute')

    now += 31_000
    globalThis.fetch = async () => {
      throw new TypeError('fetch failed')
    }
    assert.equal(await getKrakenBtcRate(), null, 'an expired rate is not served')

    globalThis.fetch = async () => new Response(JSON.stringify(ticker('60000')))
    assert.equal(await getKrakenBtcRate(), 60000, 'recovers on the next call')
  })
})

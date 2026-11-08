// LNBits may be down (spec admin-09): every call gives up quickly and reports
// "unreachable" distinctly from "LNBits answered but refused" (bad invoice key).
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { after, afterEach, before, describe, it } from 'node:test'
import LnBits, { LnBitsUnreachableError } from '../../server/utils/LnBits.ts'

describe('LnBits when LNBits is unreachable', () => {
  // Accepts connections but never answers — a hung LNBits or a stuck proxy.
  // Under `/stall` it sends the headers, then never finishes the body.
  let hangingServer: Server
  let hangingUrl: string

  before(async () => {
    hangingServer = createServer((req, res) => {
      if (req.url?.startsWith('/stall/')) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.write('{')
      }
    })
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

  // LNBits itself always answers JSON, errors included.
  const respondWith = (status: number, body: unknown = {}) => {
    globalThis.fetch = async () => new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const lnbits = new LnBits({ apiKey: 'k', url: 'http://lnbits.test' })

  it('times out a call that gets no answer', async () => {
    const hung = new LnBits({ apiKey: 'k', url: hangingUrl, timeoutMs: 50 })
    const started = Date.now()
    for (const call of [hung.getBalance(), hung.getLnurlPs(), hung.getLastPayment()]) {
      await assert.rejects(call, LnBitsUnreachableError)
    }
    assert.ok(Date.now() - started < 2_000, 'gave up well before the undici defaults')
  })

  it('times out a body that stalls after the headers', async () => {
    const stalled = new LnBits({ apiKey: 'k', url: `${hangingUrl}/stall`, timeoutMs: 50 })
    await assert.rejects(stalled.getBalance(), LnBitsUnreachableError)
  })

  it('waits at most a few seconds by default', () => {
    assert.ok(lnbits.timeoutMs > 0 && lnbits.timeoutMs <= 5_000, String(lnbits.timeoutMs))
  })

  it('reports a host that does not resolve as unreachable', async () => {
    const nowhere = new LnBits({ apiKey: 'k', url: 'http://does-not-exist.invalid' })
    await assert.rejects(nowhere.getBalance(), LnBitsUnreachableError)
  })

  it('reports a network failure as unreachable', async () => {
    globalThis.fetch = async () => {
      throw new TypeError('fetch failed')
    }
    await assert.rejects(lnbits.getBalance(), LnBitsUnreachableError)
    await assert.rejects(lnbits.getLnurlPs(), LnBitsUnreachableError)
    await assert.rejects(lnbits.getLastPayment(), LnBitsUnreachableError)
  })

  it('reports a 5xx answer (LNBits down behind its proxy) as unreachable', async () => {
    respondWith(502)
    await assert.rejects(lnbits.getBalance(), LnBitsUnreachableError)
    await assert.rejects(lnbits.getLnurlPs(), LnBitsUnreachableError)
    await assert.rejects(lnbits.getLastPayment(), LnBitsUnreachableError)
  })

  it('reports a non-JSON 4xx (proxy page for a removed LNBits) as unreachable', async () => {
    globalThis.fetch = async () => new Response('404 page not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
    await assert.rejects(lnbits.getBalance(), LnBitsUnreachableError)
    await assert.rejects(lnbits.getLnurlPs(), LnBitsUnreachableError)
    await assert.rejects(lnbits.getLastPayment(), LnBitsUnreachableError)
  })

  it('keeps a 4xx answer (bad invoice key) distinct from unreachable', async () => {
    respondWith(401)
    await assert.rejects(lnbits.getBalance(), (error: Error) => !(error instanceof LnBitsUnreachableError))
    await assert.rejects(lnbits.getLastPayment(), (error: Error) => !(error instanceof LnBitsUnreachableError))
    // No LNURL-p extension (403) still just means "no links".
    respondWith(403)
    assert.equal(await lnbits.getLnurlPs(), null)
  })
})

// Brute-force limits (security audit before v1.19): failed PIN logins per
// client IP, and PIN conflicts per custodian.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { clientIp, createAttemptLimit } from '../../server/utils/attemptLimit.ts'

describe('createAttemptLimit', () => {
  const clock = () => {
    let now = 1_000_000
    return { now: () => now, advance: (ms: number) => (now += ms) }
  }

  it('blocks a key once it reached the limit within the window', () => {
    const time = clock()
    const limit = createAttemptLimit({ max: 3, windowMs: 60_000, now: time.now })
    for (let i = 0; i < 2; i++) limit.record('a')
    assert.equal(limit.blocked('a'), false)
    limit.record('a')
    assert.equal(limit.blocked('a'), true)
  })

  it('keeps keys apart', () => {
    const limit = createAttemptLimit({ max: 1, windowMs: 60_000 })
    limit.record('a')
    assert.equal(limit.blocked('a'), true)
    assert.equal(limit.blocked('b'), false)
  })

  it('lets a key in again once the window has passed', () => {
    const time = clock()
    const limit = createAttemptLimit({ max: 2, windowMs: 60_000, now: time.now })
    limit.record('a')
    limit.record('a')
    time.advance(59_999)
    assert.equal(limit.blocked('a'), true)
    time.advance(1)
    assert.equal(limit.blocked('a'), false)
    limit.record('a')
    assert.equal(limit.blocked('a'), false, 'a new window starts with one attempt')
  })

  it('forgets expired keys, so memory does not grow with every client', () => {
    const time = clock()
    const limit = createAttemptLimit({ max: 5, windowMs: 1_000, now: time.now })
    for (let i = 0; i < 100; i++) limit.record(`ip-${i}`)
    time.advance(1_000)
    limit.record('late')
    assert.equal(limit.size(), 1)
  })
})

describe('clientIp', () => {
  it('takes the address the proxy saw: the last X-Forwarded-For entry', () => {
    assert.equal(clientIp('198.51.100.1, 203.0.113.9', '172.18.0.2'), '203.0.113.9')
    assert.equal(clientIp(' 203.0.113.9 ', '172.18.0.2'), '203.0.113.9')
  })

  it('falls back to the socket address without a forwarded header', () => {
    assert.equal(clientIp(undefined, '172.18.0.2'), '172.18.0.2')
    assert.equal(clientIp('', '172.18.0.2'), '172.18.0.2')
    assert.equal(clientIp(undefined, undefined), 'unknown')
  })
})

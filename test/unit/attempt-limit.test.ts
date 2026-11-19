// Brute-force limit: PIN conflicts per
// custodian. Failed PIN logins have their own limit (login-limit.test.ts).
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createAttemptLimit } from '../../server/utils/attemptLimit.ts'

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

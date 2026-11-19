// Failed PIN logins per client address: ten
// failures in ten minutes block the address, and each repeat lockout within a
// day blocks it longer.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { clientIp, createLoginLimit, isLoginPath } from '../../server/utils/loginLimit.ts'

const MIN = 60_000
const HOUR = 60 * MIN

const setup = () => {
  let time = 1_000_000
  const limit = createLoginLimit({
    max: 3,
    windowMs: 10 * MIN,
    penaltiesMs: [10 * MIN, HOUR, 24 * HOUR],
    forgetMs: 24 * HOUR,
    now: () => time,
  })
  const advance = (ms: number) => (time += ms)
  /** `n` attempts that arrive and then fail; returns the last settle result. */
  const fail = (key: string, n: number) => {
    let block = 0
    for (let i = 0; i < n; i++) {
      limit.record(key)
      block = limit.settle(key, true)
    }
    return block
  }
  return { limit, advance, fail }
}

describe('createLoginLimit', () => {
  it('blocks an address once it reached the limit, and says for how long', () => {
    const { limit, fail } = setup()
    assert.equal(fail('a', 2), 0)
    assert.equal(limit.retryAfter('a'), 0)
    assert.equal(fail('a', 1), 10 * MIN, 'the failure that reaches the limit starts the block')
    assert.equal(limit.retryAfter('a'), 10 * MIN)
    assert.equal(limit.retryAfter('b'), 0, 'other addresses are not affected')
  })

  it('does not count an attempt whose answer was not a failure', () => {
    const { limit, fail } = setup()
    fail('a', 2)
    limit.record('a')
    assert.equal(limit.settle('a', false), 0)
    assert.equal(limit.retryAfter('a'), 0)
    assert.equal(fail('a', 1), 10 * MIN)
  })

  it('counts an attempt as soon as it arrives, so a parallel burst cannot pass the limit', () => {
    const { limit } = setup()
    for (let i = 0; i < 3; i++) limit.record('a')
    assert.ok(limit.retryAfter('a') > 0, 'blocked while the three answers are still out')
  })

  it('lets an address in again once its block is over', () => {
    const { limit, advance, fail } = setup()
    fail('a', 3)
    advance(10 * MIN - 1)
    assert.equal(limit.retryAfter('a'), 1)
    advance(1)
    assert.equal(limit.retryAfter('a'), 0)
    assert.equal(fail('a', 2), 0, 'a new window starts from zero')
    assert.equal(limit.retryAfter('a'), 0)
  })

  it('blocks a repeat offender longer each time: 10 minutes, 1 hour, then 24 hours', () => {
    const { limit, advance, fail } = setup()
    assert.equal(fail('a', 3), 10 * MIN)
    advance(10 * MIN)
    assert.equal(fail('a', 3), HOUR)
    advance(HOUR)
    assert.equal(fail('a', 3), 24 * HOUR)
    advance(24 * HOUR)
    assert.equal(fail('a', 3), 24 * HOUR, 'stays at the longest block')
    assert.equal(limit.retryAfter('a'), 24 * HOUR)
  })

  it('forgets earlier lockouts a day after the last block ended', () => {
    const { advance, fail } = setup()
    fail('a', 3)
    advance(10 * MIN + 24 * HOUR - 1)
    assert.equal(fail('a', 3), HOUR, 'still remembered just before the day is over')
    advance(HOUR + 24 * HOUR)
    assert.equal(fail('a', 3), 10 * MIN, 'back to the first block')
  })

  it('counts one lockout for a burst, however many of its answers fail', () => {
    const { limit, advance } = setup()
    for (let i = 0; i < 3; i++) limit.record('a')
    const blocks = [0, 1, 2].map(() => limit.settle('a', true))
    assert.deepEqual(blocks, [10 * MIN, 0, 0])
    advance(10 * MIN)
    for (let i = 0; i < 3; i++) limit.record('a')
    assert.equal(limit.settle('a', true), HOUR, 'the next lockout is the second, not the fourth')
  })

  it('keeps a block once it started, even if a slower answer of the same burst succeeds', () => {
    const { limit } = setup()
    for (let i = 0; i < 3; i++) limit.record('a')
    limit.settle('a', true)
    limit.settle('a', false)
    assert.equal(limit.retryAfter('a'), 10 * MIN)
  })

  it('forgets addresses that have nothing left to remember, so memory does not grow with every client', () => {
    const { limit, advance, fail } = setup()
    for (let i = 0; i < 100; i++) fail(`ip-${i}`, 1)
    fail('repeat', 3)
    advance(10 * MIN)
    limit.record('late')
    assert.equal(limit.size(), 2, 'only the locked-out address and the new one are left')
    advance(24 * HOUR)
    limit.record('later')
    assert.equal(limit.size(), 1)
  })

  it('drops an address that is back at zero', () => {
    const { limit } = setup()
    limit.record('a')
    limit.settle('a', false)
    assert.equal(limit.size(), 0)
    limit.settle('unknown', false)
    assert.equal(limit.size(), 0)
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

describe('isLoginPath', () => {
  it('matches every spelling the router serves the login under', () => {
    for (const path of ['/api/auth/login', '/api/auth/login/', '/api/auth/login//', '/api/auth/%6Cogin', '/api/auth/%6c%6fgin', '//api/auth/login', '/api//auth/login']) {
      assert.equal(isLoginPath(path), true, path)
    }
  })

  it('does not match other paths', () => {
    for (const path of ['/api/auth/logout', '/api/auth/login-x', '/api/auth', '/', '/api/auth/%zz']) {
      assert.equal(isLoginPath(path), false, path)
    }
  })
})

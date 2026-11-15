// The app refuses to start with Logto enabled but no cookie encryption key of
// its own: the built-in fallback is public, so anyone could forge an admin
// session with it.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { FALLBACK_COOKIE_KEY, logtoConfigState } from '../../server/utils/logtoConfig.ts'

describe('logtoConfigState', () => {
  it('is "disabled" without an endpoint, with the fallback or a key of its own', () => {
    assert.equal(logtoConfigState({ endpoint: '', cookieEncryptionKey: FALLBACK_COOKIE_KEY }), 'disabled')
    assert.equal(logtoConfigState({ endpoint: '', cookieEncryptionKey: 'a-real-secret' }), 'disabled')
  })

  it('is "no-key" with an empty or blank key, with or without an endpoint', () => {
    // An empty env var replaces the fallback, and @logto/node then throws on
    // every request, Logto on or off.
    for (const endpoint of ['', 'https://logto.tsp.tools/']) {
      for (const cookieEncryptionKey of ['', '   ']) {
        assert.equal(logtoConfigState({ endpoint, cookieEncryptionKey }), 'no-key', JSON.stringify({ endpoint, cookieEncryptionKey }))
      }
    }
  })

  it('is "insecure" with an endpoint and the fallback key', () => {
    assert.equal(logtoConfigState({ endpoint: 'https://logto.tsp.tools/', cookieEncryptionKey: FALLBACK_COOKIE_KEY }), 'insecure')
  })

  it('is "configured" with an endpoint and a key of its own', () => {
    assert.equal(logtoConfigState({ endpoint: 'https://logto.tsp.tools/', cookieEncryptionKey: 'a-real-secret' }), 'configured')
  })

  it('is the fallback nuxt.config.ts uses', async () => {
    const config = await import('node:fs').then(fs => fs.readFileSync(new URL('../../nuxt.config.ts', import.meta.url), 'utf8'))
    assert.ok(config.includes('cookieEncryptionKey: FALLBACK_COOKIE_KEY,'))
  })
})

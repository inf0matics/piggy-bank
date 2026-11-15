// The app refuses to start with Logto enabled but no cookie encryption key of
// its own: the built-in fallback is public, so anyone could forge an admin
// session with it.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { FALLBACK_COOKIE_KEY, logtoConfigState } from '../../server/utils/logtoConfig.ts'

describe('logtoConfigState', () => {
  it('is "disabled" without an endpoint, whatever the key', () => {
    assert.equal(logtoConfigState({ endpoint: '', cookieEncryptionKey: FALLBACK_COOKIE_KEY }), 'disabled')
    assert.equal(logtoConfigState({ endpoint: '', cookieEncryptionKey: '' }), 'disabled')
  })

  it('is "insecure" with an endpoint and the fallback, an empty or a blank key', () => {
    for (const cookieEncryptionKey of [FALLBACK_COOKIE_KEY, '', '   ']) {
      assert.equal(logtoConfigState({ endpoint: 'https://logto.tsp.tools/', cookieEncryptionKey }), 'insecure', JSON.stringify(cookieEncryptionKey))
    }
  })

  it('is "configured" with an endpoint and a key of its own', () => {
    assert.equal(logtoConfigState({ endpoint: 'https://logto.tsp.tools/', cookieEncryptionKey: 'a-real-secret' }), 'configured')
  })

  it('matches the fallback in nuxt.config.ts', async () => {
    const config = await import('node:fs').then(fs => fs.readFileSync(new URL('../../nuxt.config.ts', import.meta.url), 'utf8'))
    assert.ok(config.includes(`cookieEncryptionKey: '${FALLBACK_COOKIE_KEY}'`))
  })
})

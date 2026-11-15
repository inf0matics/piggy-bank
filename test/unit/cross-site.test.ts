// Writes (and the admin sign-out) another site sends with the admin's cookie
// are refused; the app's own requests and non-browser clients are not.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isCrossSiteRequest } from '../../server/utils/crossSite.ts'

const HOST = 'piggy-bank.tsp.tools'
const write = (headers: { secFetchSite?: string, origin?: string }, method = 'POST', path = '/api/admin/piggy-banks') =>
  isCrossSiteRequest({ method, path, host: HOST, ...headers })

describe('isCrossSiteRequest', () => {
  it('lets reads through, whoever sends them', () => {
    for (const method of ['GET', 'HEAD', 'OPTIONS', 'get']) {
      assert.equal(write({ secFetchSite: 'cross-site', origin: 'https://evil.example' }, method), false)
    }
  })

  it('decides writes by Sec-Fetch-Site when the browser sends it', () => {
    assert.equal(write({ secFetchSite: 'same-origin' }), false)
    assert.equal(write({ secFetchSite: 'none' }), false)
    assert.equal(write({ secFetchSite: 'same-site' }), true)
    assert.equal(write({ secFetchSite: 'cross-site' }), true)
    assert.equal(write({ secFetchSite: '' }), true)
  })

  it('trusts Sec-Fetch-Site over Origin', () => {
    assert.equal(write({ secFetchSite: 'same-site', origin: `https://${HOST}` }), true)
  })

  it('falls back to Origin, which must be this app', () => {
    assert.equal(write({ origin: `https://${HOST}` }), false)
    assert.equal(write({ origin: 'https://todo.tsp.tools' }), true)
    assert.equal(write({ origin: 'https://customer.preview.tsp.tools' }), true)
    assert.equal(write({ origin: 'null' }), true)
    assert.equal(write({ origin: 'not a url' }), true)
  })

  it('allows a write with neither header (curl, a server)', () => {
    assert.equal(write({}), false)
  })

  it('checks every write method', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      assert.equal(write({ secFetchSite: 'same-site' }, method), true)
    }
  })

  it('checks the GET sign-out like a write, with or without a query', () => {
    for (const path of ['/admin/sign-out', '/admin/sign-out?x=1']) {
      assert.equal(write({ secFetchSite: 'same-site' }, 'GET', path), true)
      assert.equal(write({ origin: 'https://todo.tsp.tools' }, 'GET', path), true)
      assert.equal(write({ secFetchSite: 'same-origin' }, 'GET', path), false)
      assert.equal(write({ secFetchSite: 'none' }, 'GET', path), false)
      assert.equal(write({}, 'GET', path), false)
    }
  })

  it('sees the sign-out behind leading slashes, as Logto does', () => {
    // h3's getRequestURL, which Logto matches on, collapses leading slashes.
    for (const path of ['//admin/sign-out', '///admin/sign-out?x=1', '/\\admin/sign-out']) {
      assert.equal(write({ secFetchSite: 'cross-site' }, 'GET', path), true, path)
    }
  })

  it('leaves other GETs under /admin alone', () => {
    assert.equal(write({ secFetchSite: 'cross-site' }, 'GET', '/admin/sign-in'), false)
    assert.equal(write({ secFetchSite: 'cross-site' }, 'GET', '/admin/callback'), false)
  })
})

// The e2e admin shim makes any request with an `e2e_admin` cookie an admin. It
// must never be live by accident: outside `nuxt dev` it needs an explicit
// ALLOW_E2E_ADMIN_AUTH=true, which only the e2e compose sets (security audit
// before v1.19).
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { e2eAdminAuthRefused } from '../../server/utils/adminAuthMode.ts'

describe('e2eAdminAuthRefused', () => {
  it('lets the normal Logto mode through', () => {
    assert.equal(e2eAdminAuthRefused({ adminAuthMode: 'logto', dev: false, allow: undefined }), false)
    assert.equal(e2eAdminAuthRefused({ adminAuthMode: '', dev: false, allow: undefined }), false)
  })

  it('refuses the e2e shim in a built server without the explicit opt-in', () => {
    assert.equal(e2eAdminAuthRefused({ adminAuthMode: 'e2e', dev: false, allow: undefined }), true)
    assert.equal(e2eAdminAuthRefused({ adminAuthMode: 'e2e', dev: false, allow: '1' }), true)
    assert.equal(e2eAdminAuthRefused({ adminAuthMode: 'e2e', dev: false, allow: 'yes' }), true)
  })

  it('allows it with ALLOW_E2E_ADMIN_AUTH=true, or under nuxt dev', () => {
    assert.equal(e2eAdminAuthRefused({ adminAuthMode: 'e2e', dev: false, allow: 'true' }), false)
    assert.equal(e2eAdminAuthRefused({ adminAuthMode: 'e2e', dev: true, allow: undefined }), false)
  })
})

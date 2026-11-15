import { expect, test } from '@playwright/test'

// Every response carries the security headers and does not name the framework:
// pages (public and admin), the API, and a 404.
//
// Error responses (the API's 401, the 404) come from Nitro's error handler,
// which sets a stricter CSP (`script-src 'none'; frame-ancestors 'none'`) and
// `Referrer-Policy: no-referrer`. Those still forbid framing and leak less, so
// the checks accept them.
const PATHS = ['/', '/admin', '/api/admin/me', '/no-such-page']

for (const path of PATHS) {
  test(`security headers on ${path}`, async ({ request }) => {
    const headers = (await request.get(path, { maxRedirects: 0 })).headers()

    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['content-security-policy']).toContain('frame-ancestors \'none\'')
    expect(headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(['strict-origin-when-cross-origin', 'no-referrer']).toContain(headers['referrer-policy'])
    expect(headers['x-powered-by']).toBeUndefined()
  })
}

test('pages get exactly the configured CSP and referrer policy', async ({ request }) => {
  const headers = (await request.get('/admin')).headers()
  expect(headers['content-security-policy']).toBe('frame-ancestors \'none\'')
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
})

test('the 404 really is a 404', async ({ request }) => {
  expect((await request.get('/no-such-page')).status()).toBe(404)
})

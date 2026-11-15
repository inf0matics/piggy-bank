import { expect, test } from '@playwright/test'

// Writes another site sends with the admin's cookie are refused; the app's
// own writes are not. Sibling *.tsp.tools pages count as same-site to the
// browser, so SameSite=Lax alone would let their writes through.
const ADMIN_COOKIE = { cookie: 'e2e_admin=1' }
const NAME = 'Cross-site e2e'
const piggyBank = { name: NAME, accessKey: '987654', lnbitsUrl: 'http://lnbits-mock', invoiceKey: 'test-invoice-key' }

test.afterEach(async ({ request }) => {
  const list = await request.get('/api/admin/piggy-banks', { headers: ADMIN_COOKIE }).then(r => r.json()) as { id: string, name: string }[]
  for (const pb of list.filter(p => p.name === NAME)) {
    await request.delete(`/api/admin/piggy-banks/${pb.id}`, { headers: ADMIN_COOKIE })
  }
})

test('a same-site write with the admin cookie is refused', async ({ request }) => {
  const response = await request.post('/api/admin/piggy-banks', {
    headers: { ...ADMIN_COOKIE, 'sec-fetch-site': 'same-site' },
    data: piggyBank,
  })
  expect(response.status()).toBe(403)
  expect(await response.text()).not.toContain('same-site')
})

test('a write from a foreign Origin is refused, without echoing it', async ({ request }) => {
  const response = await request.post('/api/admin/piggy-banks', {
    headers: { ...ADMIN_COOKIE, origin: 'https://evil-sibling.tsp.tools' },
    data: piggyBank,
  })
  expect(response.status()).toBe(403)
  expect(await response.text()).not.toContain('evil-sibling')
})

test('a text/plain write from a sibling is refused', async ({ request }) => {
  const response = await request.post('/api/admin/piggy-banks', {
    headers: { ...ADMIN_COOKIE, 'sec-fetch-site': 'same-site', 'content-type': 'text/plain' },
    data: JSON.stringify(piggyBank),
  })
  expect(response.status()).toBe(403)
})

test('the app\'s own write still works', async ({ request }) => {
  const response = await request.post('/api/admin/piggy-banks', {
    headers: { ...ADMIN_COOKIE, 'sec-fetch-site': 'same-origin' },
    data: piggyBank,
  })
  expect(response.ok()).toBe(true)
  expect((await response.json()).name).toBe(NAME)
})

test('a cross-site GET of the sign-out is refused', async ({ request }) => {
  const response = await request.get('/admin/sign-out', {
    headers: { ...ADMIN_COOKIE, 'sec-fetch-site': 'same-site' },
    maxRedirects: 0,
  })
  expect(response.status()).toBe(403)
})

test('the app\'s own sign-out is not refused', async ({ request }) => {
  const response = await request.get('/admin/sign-out', {
    headers: { ...ADMIN_COOKIE, 'sec-fetch-site': 'same-origin' },
    maxRedirects: 0,
  })
  expect(response.status()).not.toBe(403)
})

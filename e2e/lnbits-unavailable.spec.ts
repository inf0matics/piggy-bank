import { test, expect, type Page } from '@playwright/test'
import { login } from './helpers/login'
import { resetMock, setMockState } from './helpers/mockControl'

// The app must stay usable while LNBits is down (spec admin-09). The mock's
// `reachable: false` switch drops every LNBits connection; the Kraken ticker it
// also serves stays up. Seeded users (e2e/seed-test-db.mjs): "Test" (PIN 0000,
// LNURL-p active) and "Nolnurlp" (LNURL-p inactive), both on the mock.

const DEFAULT_BALANCE = '0.00100000 BTC'

const row = (page: Page, name: string) =>
  page.locator('[data-testid="pb-row"]', { hasText: name })

const loginAsAdmin = (page: Page) => page.context().addCookies([{
  name: 'e2e_admin',
  value: '1',
  domain: '127.0.0.1',
  path: '/',
}])

const deleteByName = async (page: Page, name: string) => {
  const list = await page.request.get('/api/admin/piggy-banks').then(r => r.json()) as { id: string, name: string }[]
  for (const pb of list.filter(p => p.name === name)) {
    await page.request.delete(`/api/admin/piggy-banks/${pb.id}`)
  }
}

test.beforeEach(async () => {
  await resetMock()
})

test.afterAll(async () => {
  await resetMock()
})

test('admin list renders and rows show the unreachable state', async ({ page }) => {
  await setMockState({ reachable: false })
  await loginAsAdmin(page)
  await page.goto('/admin/piggy-banks')

  for (const name of ['Test', 'Nolnurlp']) {
    await expect(row(page, name).locator('[data-lnurlp="unreachable"]')).toBeVisible()
    await expect(row(page, name)).toContainText('Unreachable')
    await expect(row(page, name)).toContainText('Last tx unknown')
    await expect(row(page, name).getByRole('button', { name: 'Deposit' })).toHaveAttribute('aria-disabled', 'true')
  }
})

test('admin list: one unreachable LNBits does not block the other rows', async ({ page }) => {
  await loginAsAdmin(page)
  await page.request.post('/api/admin/piggy-banks', {
    data: { name: 'Offline', accessKey: '9753', lnbitsUrl: 'http://does-not-exist.invalid', invoiceKey: 'k' },
  })

  try {
    await page.goto('/admin/piggy-banks')
    await expect(row(page, 'Offline').locator('[data-lnurlp="unreachable"]')).toBeVisible()
    await expect(row(page, 'Test').locator('[data-lnurlp="active"]')).toBeVisible()
    await expect(row(page, 'Nolnurlp').locator('[data-lnurlp="inactive"]')).toBeVisible()
  } finally {
    await deleteByName(page, 'Offline')
  }
})

test('creating and editing a piggy bank still works', async ({ page }) => {
  await setMockState({ reachable: false })
  await loginAsAdmin(page)

  try {
    await page.goto('/admin/piggy-banks/new')
    await page.locator('#name').fill('Downtime')
    await page.locator('#accessKey').fill('8531')
    await page.locator('#lnbitsUrl').fill('http://lnbits-mock')
    await page.locator('#invoiceKey').fill('test-invoice-key')
    await page.getByRole('button', { name: 'Create' }).click()
    await page.waitForURL(url => url.pathname === '/admin/piggy-banks')
    await expect(row(page, 'Downtime')).toBeVisible()

    await row(page, 'Downtime').getByText('Downtime').click()
    await page.waitForURL('**/admin/piggy-banks/*/edit')
    await expect(page.locator('#name')).toHaveValue('Downtime')
    await page.locator('#name').fill('Downtime edited')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForURL(url => url.pathname === '/admin/piggy-banks')
    await expect(row(page, 'Downtime edited')).toBeVisible()
  } finally {
    await deleteByName(page, 'Downtime')
    await deleteByName(page, 'Downtime edited')
  }
})

test('PIN login works and the dashboard shows the balance as unavailable', async ({ page }) => {
  await setMockState({ reachable: false })
  await login(page)

  await expect(page.getByText('Test\'s')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('sats-balance')).toHaveText('Balance currently unavailable', { timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Deposit' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
})

test('the dashboard shows the balance again when LNBits comes back, without a reload', async ({ page }) => {
  await setMockState({ reachable: false })
  await login(page)
  await expect(page.getByTestId('sats-balance')).toHaveText('Balance currently unavailable', { timeout: 15_000 })

  await setMockState({ reachable: true })

  await expect(page.getByTestId('sats-balance')).toHaveText(DEFAULT_BALANCE, { timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Deposit' })).toBeVisible()
})

test('the dashboard switches to unavailable when LNBits goes away mid-session', async ({ page }) => {
  await login(page)
  await expect(page.getByTestId('sats-balance')).toHaveText(DEFAULT_BALANCE, { timeout: 15_000 })

  await setMockState({ reachable: false })

  await expect(page.getByTestId('sats-balance')).toHaveText('Balance currently unavailable', { timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Deposit' })).toHaveCount(0)

  await setMockState({ reachable: true })
  await expect(page.getByTestId('sats-balance')).toHaveText(DEFAULT_BALANCE, { timeout: 15_000 })
})

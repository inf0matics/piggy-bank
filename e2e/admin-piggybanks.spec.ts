import { test, expect, type Page } from '@playwright/test'
import { resetMock } from './helpers/mockControl'

// Authenticated admin tests. The app runs with NUXT_PUBLIC_ADMIN_AUTH_MODE=e2e
// (see docker-compose.e2e.yml), so an `e2e_admin` cookie counts as a logged-in
// admin — no real Logto tenant needed. The DB is seeded with two users
// (e2e/seed-test-db.mjs): "Test" (PIN 0000, LNURL-p active) and "Nolnurlp"
// (PIN 1111, LNURL-p inactive). The shared DB persists across the run, so each
// mutating test creates its own fixture and cleans up.

interface PiggyBank {
  id: string
  name: string
  accessKey: string
  lnbitsUrl: string
}

const createPiggyBank = (page: Page, data: { name: string, accessKey: string, lnbitsUrl: string, invoiceKey: string }) =>
  page.request.post('/api/admin/piggy-banks', { data }).then(r => r.json()) as Promise<PiggyBank>

const deletePiggyBank = (page: Page, id: string) =>
  page.request.delete(`/api/admin/piggy-banks/${id}`)

const findByName = async (page: Page, name: string): Promise<PiggyBank | undefined> => {
  const list = await page.request.get('/api/admin/piggy-banks').then(r => r.json()) as PiggyBank[]
  return list.find(p => p.name === name)
}

test.beforeEach(async ({ page }) => {
  await resetMock()
  await page.context().addCookies([{
    name: 'e2e_admin',
    value: '1',
    domain: '127.0.0.1',
    path: '/',
  }])
})

test('list renders piggy banks in "Name @ lnbits-url" format', async ({ page }) => {
  await page.goto('/admin/piggy-banks')

  const row = page.locator('[data-testid="pb-row"]', { hasText: 'Test' })
  await expect(row).toBeVisible()
  await expect(row).toContainText('@')
  await expect(row).toContainText('lnbits-mock')
})

test('LNURL-p active badge is shown for a user with it configured', async ({ page }) => {
  await page.goto('/admin/piggy-banks')

  const row = page.locator('[data-testid="pb-row"]', { hasText: 'Test' })
  await expect(row.locator('[data-lnurlp="active"]')).toBeVisible()
})

test('LNURL-p inactive badge is shown for a user without it', async ({ page }) => {
  await page.goto('/admin/piggy-banks')

  const row = page.locator('[data-testid="pb-row"]', { hasText: 'Nolnurlp' })
  await expect(row.locator('[data-lnurlp="inactive"]')).toBeVisible()
})

test('PIN is masked by default; the eye toggle reveals and re-hides it', async ({ page }) => {
  await page.goto('/admin/piggy-banks')

  const row = page.locator('[data-testid="pb-row"]', { hasText: 'Test' })
  const pin = row.locator('.font-mono')

  await expect(pin).toHaveText('••••')

  await row.getByRole('button', { name: 'Reveal PIN' }).click()
  await expect(pin).toHaveText('0000')

  await row.getByRole('button', { name: 'Hide PIN' }).click()
  await expect(pin).toHaveText('••••')
})

test('create: Add opens the form, default URL is pre-filled, submit adds a row', async ({ page }) => {
  // Ensure a known default LNBits URL is configured.
  await page.request.put('/api/admin/settings', { data: { defaultLnbitsUrl: 'http://lnbits-mock' } })

  await page.goto('/admin/piggy-banks')
  await page.getByRole('link', { name: 'Add piggy bank' }).click()
  await page.waitForURL('**/admin/piggy-banks/new')

  // Default LNBits URL pre-filled from Settings.
  await expect(page.locator('#lnbitsUrl')).toHaveValue('http://lnbits-mock')

  await page.locator('#name').fill('Charlie')
  await page.locator('#accessKey').fill('2468')
  await page.locator('#invoiceKey').fill('test-invoice-key')
  await page.getByRole('button', { name: 'Create' }).click()

  await page.waitForURL(url => url.pathname === '/admin/piggy-banks')
  await expect(page.locator('[data-testid="pb-row"]', { hasText: 'Charlie' })).toBeVisible()

  const created = await findByName(page, 'Charlie')
  if (created) await deletePiggyBank(page, created.id)
})

test('edit: form is pre-filled and saving updates the row', async ({ page }) => {
  const pb = await createPiggyBank(page, {
    name: 'EditMe',
    accessKey: '1357',
    lnbitsUrl: 'http://lnbits-mock',
    invoiceKey: 'test-invoice-key',
  })

  await page.goto(`/admin/piggy-banks/${pb.id}/edit`)
  await expect(page.locator('#name')).toHaveValue('EditMe')
  await expect(page.locator('#accessKey')).toHaveValue('1357')

  await page.locator('#name').fill('Edited')
  await page.getByRole('button', { name: 'Save' }).click()

  await page.waitForURL(url => url.pathname === '/admin/piggy-banks')
  await expect(page.locator('[data-testid="pb-row"]', { hasText: 'Edited' })).toBeVisible()

  await deletePiggyBank(page, pb.id)
})

test('delete: clicking delete removes the row', async ({ page }) => {
  await createPiggyBank(page, {
    name: 'DeleteMe',
    accessKey: '8642',
    lnbitsUrl: 'http://lnbits-mock',
    invoiceKey: 'test-invoice-key',
  })

  await page.goto('/admin/piggy-banks')
  const row = page.locator('[data-testid="pb-row"]', { hasText: 'DeleteMe' })
  await expect(row).toBeVisible()

  await row.getByRole('button', { name: 'Delete' }).click()
  await expect(page.locator('[data-testid="pb-row"]', { hasText: 'DeleteMe' })).toHaveCount(0)
})

test('settings: a default LNBits URL persists and pre-fills the create form', async ({ page }) => {
  await page.goto('/admin/settings')
  await page.locator('#default-lnbits-url').fill('http://lnbits-mock')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Saved.')).toBeVisible()

  // Persists across reloads.
  await page.reload()
  await expect(page.locator('#default-lnbits-url')).toHaveValue('http://lnbits-mock')

  // Pre-fills the new-piggy-bank form.
  await page.goto('/admin/piggy-banks/new')
  await expect(page.locator('#lnbitsUrl')).toHaveValue('http://lnbits-mock')
})

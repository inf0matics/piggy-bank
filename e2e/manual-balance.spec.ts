import { test, expect, type Page } from '@playwright/test'
import { createPiggyBank, deleteByName, loginAsAdmin, type PiggyBank } from './helpers/admin'
import { login } from './helpers/login'
import { resetMock, setMockState } from './helpers/mockControl'

// A piggy bank can be frozen and cut loose from LNBits: its balance source
// switches to Manual (spec admin-10). Each test creates its own piggy bank on the
// mock (the shared seed users stay on LNBits) and deletes it afterwards. The
// mock's Kraken ticker serves 1 BTC = 50,000 EUR throughout.

const row = (page: Page, name: string) =>
  page.locator('[data-testid="pb-row"]', { hasText: name })

const openSwitchDialog = async (page: Page, pb: PiggyBank) => {
  await page.goto(`/admin/piggy-banks/${pb.id}/edit`)
  await page.getByTestId('balance-source').getByRole('button', { name: 'Switch to manual' }).click()
  return page.getByRole('dialog')
}

test.beforeEach(async ({ page }) => {
  await resetMock()
  await loginAsAdmin(page)
})

test.afterAll(async () => {
  await resetMock()
})

test('switching with LNBits reachable freezes the LNBits balance and keeps its last payment', async ({ page }) => {
  await setMockState({ balance: 123_456, payment: { sats: 2_100, comment: 'Birthday' } })
  const pb = await createPiggyBank(page, 'Frozen', '6420')

  try {
    const dialog = await openSwitchDialog(page, pb)
    await expect(dialog.getByTestId('wallet-balance')).toContainText('123,456 sats')
    await dialog.getByRole('button', { name: 'Switch to manual' }).click()

    await expect(page.getByTestId('manual-balance')).toHaveText('123,456 sats')
    await expect(page.getByTestId('balance-source')).toContainText('Manual')

    // LNBits moves on; the frozen balance does not.
    await setMockState({ balance: 999_999 })
    await login(page, '6420')
    await expect(page.getByTestId('sats-balance')).toHaveText('0.00123456 BTC', { timeout: 15_000 })
    await expect(page.getByText('1 BTC = 50000 EUR')).toBeVisible()
    await expect(page.getByText('61.73 EUR')).toBeVisible()
    // The child sees no trace of the freeze: still the last real payment.
    await expect(page.getByText('Last Payment')).toBeVisible()
    await expect(page.getByText('0.00002100 BTC')).toBeVisible()
    await expect(page.getByText('Birthday')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Deposit' })).toHaveCount(0)
  } finally {
    await deleteByName(page, 'Frozen')
  }
})

test('switching with LNBits unreachable takes a starting balance from the custodian', async ({ page }) => {
  const pb = await createPiggyBank(page, 'Entered', '6421')
  await setMockState({ reachable: false })

  try {
    const dialog = await openSwitchDialog(page, pb)
    const confirm = dialog.getByRole('button', { name: 'Switch to manual' })
    await expect(dialog.locator('#startingSats')).toBeVisible({ timeout: 10_000 })
    await expect(confirm).toBeDisabled()
    await dialog.locator('#startingSats').fill('4200')
    await confirm.click()

    await expect(page.getByTestId('manual-balance')).toHaveText('4,200 sats')

    await login(page, '6421')
    await expect(page.getByTestId('sats-balance')).toHaveText('0.00004200 BTC', { timeout: 15_000 })
    // No LNBits payment to keep: the freeze is the first change.
    await expect(page.getByText('Last Payment')).toBeVisible()
    await expect(page.getByText('0.00004200 BTC')).toHaveCount(2)
    await expect(page.getByRole('button', { name: 'Deposit' })).toHaveCount(0)
  } finally {
    await deleteByName(page, 'Entered')
  }
})

test('a manual piggy bank\'s dashboard keeps working while LNBits is down', async ({ page }) => {
  const pb = await createPiggyBank(page, 'Steady', '6422')

  try {
    await page.request.post(`/api/admin/piggy-banks/${pb.id}/manual`, { data: { sats: 77_777 } })
    // Hung, not just down: any LNBits call would cost the dashboard its timeout.
    await setMockState({ hang: true })

    await login(page, '6422')
    await expect(page.getByTestId('sats-balance')).toHaveText('0.00077777 BTC', { timeout: 5_000 })
    // Frozen while LNBits had no payments: none to show.
    await expect(page.getByText('Last Payment')).toHaveCount(0)
    await page.waitForTimeout(4_000)
    await expect(page.getByTestId('sats-balance')).toHaveText('0.00077777 BTC')
  } finally {
    await setMockState({ hang: false })
    await deleteByName(page, 'Steady')
  }
})

test('the admin list shows "manual" for that row, asks LNBits nothing for it, and leaves the others alone', async ({ page }) => {
  const pb = await createPiggyBank(page, 'Listed', '6423')

  try {
    await page.request.post(`/api/admin/piggy-banks/${pb.id}/manual`, { data: { sats: 1_000 } })

    const statusCalls: string[] = []
    page.on('request', (request) => {
      const { pathname } = new URL(request.url())
      if (pathname.endsWith('/status')) statusCalls.push(pathname)
    })
    await page.goto('/admin/piggy-banks')

    await expect(row(page, 'Listed').locator('[data-lnurlp="manual"]')).toHaveText('Manual')
    await expect(row(page, 'Listed').getByRole('button', { name: 'Deposit' })).toHaveAttribute('aria-disabled', 'true')
    // Frozen from a wallet without payments: nothing carried over.
    await expect(row(page, 'Listed')).toContainText('No transactions yet')
    await expect(row(page, 'Test').locator('[data-lnurlp="active"]')).toBeVisible()
    await expect(row(page, 'Nolnurlp').locator('[data-lnurlp="inactive"]')).toBeVisible()
    expect(statusCalls).not.toContain(`/api/admin/piggy-banks/${pb.id}/status`)
  } finally {
    await deleteByName(page, 'Listed')
  }
})

test('the switch is guarded: input, ownership and a second freeze', async ({ page }) => {
  const pb = await createPiggyBank(page, 'Guarded', '6424')
  const freeze = (id: string, data: unknown) => page.request.post(`/api/admin/piggy-banks/${id}/manual`, { data })

  try {
    for (const sats of [-1, 1.5, '100']) {
      const response = await freeze(pb.id, { sats })
      expect(response.status(), String(sats)).toBe(400)
    }
    expect((await freeze('other-owner-user', { sats: 1 })).status()).toBe(404)
    expect((await page.request.get('/api/admin/piggy-banks/other-owner-user/lnbits-balance')).status()).toBe(404)

    expect((await freeze(pb.id, { sats: 5 })).status()).toBe(200)
    expect((await freeze(pb.id, { sats: 6 })).status()).toBe(409)

    const record = await page.request.get(`/api/admin/piggy-banks/${pb.id}`).then(r => r.json())
    expect(record.balance).toMatchObject({ source: 'manual', sats: 5 })
    // Kept for switching back to LNBits (admin-12).
    expect(record).toMatchObject({ lnbitsUrl: 'http://lnbits-mock', invoiceKey: 'test-invoice-key' })
  } finally {
    await deleteByName(page, 'Guarded')
  }
})

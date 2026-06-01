import { test, expect } from '@playwright/test'
import { login } from './helpers/login'
import { resetMock, setMockState, triggerPayment } from './helpers/mockControl'

// Default mock state: 100,000 sats, BTC/EUR rate 50,000, an active lnurl, no payment.
// 100,000 sats -> 0.00100000 BTC; 0.001 BTC * 50,000 -> 50 EUR.
const DEFAULT_BALANCE = '0.00100000 BTC'

test.beforeEach(async () => {
  await resetMock()
})

test('shows the user name', async ({ page }) => {
  await login(page)
  // The fixture user is named "Test"; the dashboard greets with "<name>'s".
  await expect(page.getByText('Test\'s')).toBeVisible({ timeout: 15_000 })
})

test('shows the sats balance', async ({ page }) => {
  await login(page)
  await expect(page.getByText(DEFAULT_BALANCE)).toBeVisible({ timeout: 15_000 })
})

test('shows the EUR value', async ({ page }) => {
  await login(page)
  await expect(page.getByText('50 EUR', { exact: true })).toBeVisible({ timeout: 15_000 })
})

test('shows the Deposit button when an lnurl is configured', async ({ page }) => {
  await login(page)
  await expect(page.getByRole('button', { name: 'Deposit' })).toBeVisible({ timeout: 15_000 })
})

test('hides the Deposit button when no lnurl is configured', async ({ page }) => {
  // Removing the lnurl also drops the derived address, so no deposit option remains.
  await setMockState({ lnurl: null })
  await login(page)

  // Wait for the dashboard data to load before asserting the button's absence.
  await expect(page.getByText(DEFAULT_BALANCE)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Deposit' })).toHaveCount(0)
})

test('shows the last payment with comment and amount', async ({ page }) => {
  await login(page)
  await expect(page.getByText(DEFAULT_BALANCE)).toBeVisible({ timeout: 15_000 })

  await triggerPayment(5_000, 'Pocket money')

  // The dashboard polls every 2s; the Last Payment panel then appears.
  await expect(page.getByText('Last Payment').first()).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Pocket money').first()).toBeVisible()
  await expect(page.getByText('0.00005000 BTC')).toBeVisible()
})

test('shows no last payment section when there is none', async ({ page }) => {
  await login(page)
  await expect(page.getByText(DEFAULT_BALANCE)).toBeVisible({ timeout: 15_000 })

  await expect(page.getByText('Last Payment')).toHaveCount(0)
})

test('logout returns to the login screen', async ({ page }) => {
  await login(page)
  await expect(page.getByText(DEFAULT_BALANCE)).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: 'Logout' }).click()

  await page.waitForURL(url => new URL(url).pathname === '/')
  await expect(page.getByText('Piggy Bank')).toBeVisible()
})

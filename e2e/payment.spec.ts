import { test, expect } from '@playwright/test'
import { login } from './helpers/login'
import { resetMock, triggerPayment } from './helpers/mockControl'

test.beforeEach(async () => {
  await resetMock()
})

test('incoming payment is reflected on the dashboard at the next poll', async ({ page }) => {
  await login(page)

  // Default mock balance is 100,000 sats -> 0.00100000 BTC.
  await expect(page.getByText('0.00100000 BTC')).toBeVisible({ timeout: 15_000 })

  // The BTC/EUR rate is served by the mock (default 50,000), proving no
  // outbound internet is needed for the rate lookup.
  await expect(page.getByText('1 BTC = 50000 EUR')).toBeVisible()

  // Simulate an incoming payment via the mock control API.
  await triggerPayment(5_000, 'Pocket money')

  // The dashboard polls every 2s; balance becomes 105,000 sats -> 0.00105000 BTC.
  await expect(page.getByText('0.00105000 BTC')).toBeVisible({ timeout: 15_000 })

  // The persistent "Last Payment" panel reflects the payment (comment + amount).
  await expect(page.getByText('Message:')).toBeVisible()
  await expect(page.getByText('Pocket money').first()).toBeVisible()
  await expect(page.getByText('0.00005000 BTC')).toBeVisible()
})

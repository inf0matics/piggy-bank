import { test, expect } from '@playwright/test'
import { login } from './helpers/login'
import { resetMock } from './helpers/mockControl'

const DEFAULT_BALANCE = '0.00100000 BTC'

test.beforeEach(async () => {
  await resetMock()
})

test('print view shows the QR code and hides the balance', async ({ page }) => {
  await login(page)
  await expect(page.getByText(DEFAULT_BALANCE)).toBeVisible({ timeout: 15_000 })

  await page.emulateMedia({ media: 'print' })

  // The print-only QR container (`print:flex`) becomes visible...
  await expect(page.locator('[class*="print:flex"] svg')).toBeVisible()
  // ...while the on-screen balance (`print:hidden`) is hidden.
  await expect(page.getByText(DEFAULT_BALANCE)).toBeHidden()
})

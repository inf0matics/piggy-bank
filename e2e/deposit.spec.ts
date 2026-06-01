import { test, expect } from '@playwright/test'
import { login } from './helpers/login'
import { resetMock, triggerPayment } from './helpers/mockControl'

const DEFAULT_BALANCE = '0.00100000 BTC'

test.beforeEach(async () => {
  await resetMock()
})

test('opens the deposit modal with the LNURL QR code', async ({ page }) => {
  await login(page)

  await page.getByRole('button', { name: 'Deposit' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  // The LNURLp tab and a rendered QR code prove the deposit details are shown.
  await expect(dialog.getByText('LNURLp')).toBeVisible()
  await expect(dialog.locator('svg').first()).toBeVisible()
})

test('closes the modal and shows a toast when a payment arrives', async ({ page }) => {
  await login(page)
  await expect(page.getByText(DEFAULT_BALANCE)).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: 'Deposit' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  await triggerPayment(1_000, 'Snack money')

  // The next dashboard poll picks up the new balance, which closes the modal
  // and raises a "+<sats> sats" payment toast.
  await expect(page.getByText('+1000 sats', { exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(dialog).toBeHidden()
})

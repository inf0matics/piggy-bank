import { expect, type Page } from '@playwright/test'

// Logs in via the PIN keypad on the homepage. The keypad listens for physical
// key presses (digits 0-9 and Enter), so we enter the PIN digit by digit and
// submit, then wait for the redirect to /dashboard.
export async function login(page: Page, pin = '0000') {
  await page.goto('/')
  // Wait for the keypad component to mount (its keydown listener is attached on mount).
  await expect(page.getByText('Piggy Bank')).toBeVisible()

  for (const digit of pin) {
    await page.keyboard.press(digit)
  }
  await page.keyboard.press('Enter')

  await page.waitForURL('**/dashboard')
}

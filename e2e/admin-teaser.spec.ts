import { test, expect } from '@playwright/test'
import { resetMock } from './helpers/mockControl'

// Correct PIN comes from the test fixture (e2e/fixtures/config.test.json).
const PIN = '0000'

test.beforeEach(async () => {
  await resetMock()
})

test('teaser bar is visible on the PIN page below "Powered by Lightning"', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Piggy Bank')).toBeVisible()

  await expect(page.getByText('Powered by')).toBeVisible()
  await expect(page.getByText('Want to create one for a friend?')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Start here →' })).toBeVisible()
})

test('clicking "Start here →" navigates to /admin', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Start here →' }).click()

  await page.waitForURL('**/admin')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Bitcoin piggy bank')
})

test('PIN entry flow is unaffected - correct PIN still redirects to /dashboard', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Piggy Bank')).toBeVisible()

  for (const digit of PIN) {
    await page.getByRole('button', { name: digit, exact: true }).click()
  }
  await page.getByRole('button', { name: 'Enter', exact: true }).click()

  await page.waitForURL('**/dashboard')
})

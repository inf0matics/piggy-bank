import { test, expect } from '@playwright/test'
import { login } from './helpers/login'
import { resetMock } from './helpers/mockControl'

// Correct PIN comes from the test fixture (e2e/fixtures/config.test.json).
const PIN = '0000'

test.beforeEach(async () => {
  await resetMock()
})

test('PIN login - success via on-screen keypad', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Piggy Bank')).toBeVisible()

  for (const digit of PIN) {
    await page.getByRole('button', { name: digit, exact: true }).click()
  }
  await page.getByRole('button', { name: 'Enter', exact: true }).click()

  await page.waitForURL('**/dashboard')
})

test('PIN login - wrong PIN shows error and stays on login', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Piggy Bank')).toBeVisible()

  for (const digit of '1111') {
    await page.getByRole('button', { name: digit, exact: true }).click()
  }
  await page.getByRole('button', { name: 'Enter', exact: true }).click()

  await expect(page.getByText('Code not valid')).toBeVisible()
  expect(new URL(page.url()).pathname).toBe('/')
})

test('PIN login - physical keyboard', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Piggy Bank')).toBeVisible()

  for (const digit of PIN) {
    await page.keyboard.press(digit)
  }
  await page.keyboard.press('Enter')

  await page.waitForURL('**/dashboard')
})

test('Already logged in - navigating to / redirects to dashboard', async ({ page }) => {
  await login(page)

  // The auth session is cookie-backed, so a fresh load of "/" re-runs the
  // login page's redirectIfLoggedIn() guard and bounces back to the dashboard.
  await page.goto('/')
  await page.waitForURL('**/dashboard')
})

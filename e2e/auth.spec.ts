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

  // exact match targets the toast title only; a substring match also hits the
  // aria-live alert region ("Notification Code not valid") and trips strict mode.
  await expect(page.getByText('Code not valid', { exact: true })).toBeVisible()
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

test('Expired session - /dashboard redirects to login without an error toast', async ({ page, context }) => {
  // Simulate a user returning after the refresh token has lapsed: a stale
  // refresh_token cookie that no longer validates. The dashboard must redirect
  // to the login page and must NOT flash an "Error" toast from a polled fetch
  // that runs with no access token (regression for the stale-session bug).
  await context.addCookies([{
    name: 'refresh_token',
    value: 'stale.invalid.token',
    domain: '127.0.0.1',
    path: '/',
  }])

  await page.goto('/dashboard')

  await page.waitForURL(url => url.pathname === '/')
  await expect(page.getByText('Piggy Bank')).toBeVisible()

  // Give any erroneous poll time to resolve, then assert no error toast appeared.
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('Error', { exact: true })).toHaveCount(0)
})

test('Already logged in - navigating to / redirects to dashboard', async ({ page }) => {
  await login(page)

  // The auth session is cookie-backed, so a fresh load of "/" re-runs the
  // login page's redirectIfLoggedIn() guard and bounces back to the dashboard.
  await page.goto('/')
  await page.waitForURL('**/dashboard')
})

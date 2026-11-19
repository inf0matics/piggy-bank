import { test, expect, type APIRequestContext } from '@playwright/test'
import { login } from './helpers/login'
import { resetMock } from './helpers/mockControl'

// Correct PIN comes from the seeded test user (e2e/seed-test-db.mjs).
const PIN = '0000'

test.beforeEach(async () => {
  await resetMock()
})

test('PIN login - success via on-screen keypad', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Enter', exact: true })).toBeVisible()

  for (const digit of PIN) {
    await page.getByRole('button', { name: digit, exact: true }).click()
  }
  await page.getByRole('button', { name: 'Enter', exact: true }).click()

  await page.waitForURL('**/dashboard')
})

test('PIN login - wrong PIN shows error and stays on login', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Enter', exact: true })).toBeVisible()

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
  await expect(page.getByRole('button', { name: 'Enter', exact: true })).toBeVisible()

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
  await expect(page.getByRole('button', { name: 'Enter', exact: true })).toBeVisible()

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

// Brute-force limit (security audit before v1.19): 10 failed PIN logins from
// one address within 10 minutes block that address. Each test uses an address
// of its own (TEST-NET), so the block never reaches the other tests.
const loginFrom = (request: APIRequestContext, ip: string, accessKey: string) =>
  request.post('/api/auth/login', { data: { accessKey }, headers: { 'X-Forwarded-For': ip } })

test('PIN login - ten failed attempts block that address, not others', async ({ request }) => {
  for (let i = 0; i < 10; i++) {
    expect((await loginFrom(request, '203.0.113.10', `wrong-${i}`)).status()).toBe(401)
  }
  // Blocked: even the right PIN is refused now.
  const blocked = await loginFrom(request, '203.0.113.10', PIN)
  expect(blocked.status()).toBe(429)
  expect(await blocked.text()).not.toContain('accessToken')

  expect((await loginFrom(request, '203.0.113.11', PIN)).status()).toBe(200)
})

test('PIN login - a successful login does not count as a failure', async ({ request }) => {
  for (let i = 0; i < 12; i++) {
    expect((await loginFrom(request, '203.0.113.12', PIN)).status()).toBe(200)
  }
})

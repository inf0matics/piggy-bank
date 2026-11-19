import { test, expect, type APIRequestContext, type TestInfo } from '@playwright/test'
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
// one address within 10 minutes block that address for 10 minutes, a repeat
// lockout within a day for 1 hour, then 24 hours. Each test uses addresses
// of its own (198.18.0.0/15, per retry), so a block never reaches another test
// or a retry of the same one.
const LOGIN = '/api/auth/login'
const loginFrom = (request: APIRequestContext, ip: string, accessKey: string, path = LOGIN) =>
  request.post(path, { data: { accessKey }, headers: { 'X-Forwarded-For': ip } })
const address = (testInfo: TestInfo, n: number) => `198.18.${testInfo.retry}.${n}`

test('PIN login - ten failed attempts block that address, not others', async ({ request }, testInfo) => {
  const ip = address(testInfo, 10)
  for (let i = 0; i < 10; i++) {
    expect((await loginFrom(request, ip, `wrong-${i}`)).status()).toBe(401)
  }
  // Blocked: even the right PIN is refused now.
  const blocked = await loginFrom(request, ip, PIN)
  expect(blocked.status()).toBe(429)
  expect(await blocked.text()).not.toContain('accessToken')
  // The first lockout lasts 10 minutes, and the answer says so.
  const retryAfter = Number(blocked.headers()['retry-after'])
  expect(retryAfter).toBeGreaterThan(590)
  expect(retryAfter).toBeLessThanOrEqual(600)

  expect((await loginFrom(request, address(testInfo, 11), PIN)).status()).toBe(200)
})

test('PIN login - a successful login does not count as a failure', async ({ request }, testInfo) => {
  for (let i = 0; i < 12; i++) {
    expect((await loginFrom(request, address(testInfo, 12), PIN)).status()).toBe(200)
  }
})

test('PIN login - every spelling of the login path shares the limit', async ({ request }, testInfo) => {
  const ip = address(testInfo, 13)
  const variants = [`${LOGIN}/`, '/api/auth/%6Cogin', `${LOGIN}?x=1`]
  for (let i = 0; i < 10; i++) {
    expect((await loginFrom(request, ip, `wrong-${i}`, variants[i % variants.length])).status()).toBe(401)
  }
  for (const path of [LOGIN, ...variants]) {
    expect((await loginFrom(request, ip, PIN, path)).status(), path).toBe(429)
  }
})

test('PIN login - a burst of parallel guesses gets no more than ten tries', async ({ request }, testInfo) => {
  const ip = address(testInfo, 14)
  const statuses = await Promise.all(
    Array.from({ length: 25 }, (_, i) => loginFrom(request, ip, `wrong-${i}`).then(r => r.status())),
  )
  expect(statuses.filter(status => status === 401).length).toBeLessThanOrEqual(10)
  expect(statuses.every(status => status === 401 || status === 429)).toBe(true)
  expect((await loginFrom(request, ip, PIN)).status()).toBe(429)
})

import { test, expect } from '@playwright/test'

// Authenticated admin tests for the /admin/user page. The app runs with
// NUXT_PUBLIC_ADMIN_AUTH_MODE=e2e (see docker-compose.e2e.yml), so an
// `e2e_admin` cookie counts as a logged-in admin — no real Logto tenant needed.
//
// The account-center link is derived from NUXT_LOGTO_ENDPOINT, which the e2e
// stack sets to https://logto.example.com/, so the link renders here. The
// LNURL-auth status comes from Logto's userinfo endpoint, which the dummy e2e
// endpoint can't serve, so that row stays hidden and isn't asserted here.

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([{
    name: 'e2e_admin',
    value: '1',
    domain: '127.0.0.1',
    path: '/',
  }])
})

test('the LogTo account-center link points at the account security page and opens in a new tab', async ({ page }) => {
  await page.goto('/admin/user')

  const link = page.getByTestId('account-center-link')
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('href', 'https://logto.example.com/account/security')
  await expect(link).toHaveAttribute('target', '_blank')
})

test('visiting /admin/user without a session redirects to /admin', async ({ page }) => {
  await page.context().clearCookies()
  await page.goto('/admin/user')

  await page.waitForURL(url => url.pathname === '/admin')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Bitcoin piggy bank')
})

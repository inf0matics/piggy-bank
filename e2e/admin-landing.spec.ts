import { test, expect } from '@playwright/test'

// The landing page (/admin) is public and does not touch the LNBits mock, so
// these tests need no mock reset. The protected route is /admin/piggy-banks
// (the post-login destination); an unauthenticated visit redirects to /admin.
const PROTECTED_ROUTE = '/admin/piggy-banks'

test('/admin renders the landing page with the correct headline', async ({ page }) => {
  await page.goto('/admin')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Bitcoin piggy bank')
})

test('backlink in the top right navigates to /', async ({ page }) => {
  await page.goto('/admin')
  await page.getByRole('link', { name: 'Back to Piggy Bank' }).click()

  await page.waitForURL(url => url.pathname === '/')
  // The PIN keypad is the hallmark of the home page.
  await expect(page.getByRole('button', { name: 'Enter', exact: true })).toBeVisible()
})

test('all three "What you can do" cards are visible', async ({ page }) => {
  await page.goto('/admin')

  await expect(page.getByText('Manage accounts')).toBeVisible()
  await expect(page.getByText('Check setup')).toBeVisible()
  await expect(page.getByText('Read only')).toBeVisible()
})

test('both "What you need" items are present', async ({ page }) => {
  await page.goto('/admin')

  await expect(page.getByText('A LNBits wallet per person')).toBeVisible()
  await expect(page.getByText('A Lightning wallet with LNURL-auth')).toBeVisible()
})

test('visiting a protected admin route without a session redirects to /admin', async ({ page }) => {
  await page.goto(PROTECTED_ROUTE)

  await page.waitForURL(url => url.pathname === '/admin')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Bitcoin piggy bank')
})

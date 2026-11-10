import { test, expect, type Page } from '@playwright/test'
import { loginAsAdmin } from './helpers/admin'
import { login } from './helpers/login'
import { resetMock } from './helpers/mockControl'

// Spec admin-08: the admin frame, sidebar footer, account page and page
// headings are the tsp theme layer's (TspAppShell, TspSidebarFooter,
// TspAccountPage, TspPageHeader). The layer is applied SCOPED to /admin, so the
// public Piggy area must stay as it was.

// #fbad18 — amber as text on dark (.tsp-text-brand in the dark admin default).
const AMBER_RGB = 'rgb(251, 173, 24)'
// dodgerblue-500 — the public area's primary.
const DODGERBLUE_RGB = 'rgb(79, 155, 234)'

const sidebar = (page: Page) => page.getByTestId('tsp-sidebar')
const heading = (page: Page) => page.getByRole('heading', { level: 1 })

test.describe('admin shell', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('is the layer\'s, themed, with one amber nav row', async ({ page }) => {
    await page.goto('/admin/piggy-banks')

    await expect(page.getByTestId('tsp-app-shell')).toHaveClass(/tsp-theme/)
    const active = sidebar(page).locator('[data-active="true"]')
    await expect(active).toHaveCount(1)
    await expect(active).toHaveText('Piggy Banks')
    await expect(active).toHaveCSS('color', AMBER_RGB)
  })

  test('brands the sidebar with the wordmark, linking back to the public site', async ({ page }) => {
    await page.goto('/admin/piggy-banks')

    const back = sidebar(page).getByRole('link', { name: 'Back to Piggy Bank' })
    await expect(back).toHaveAttribute('href', '/')
    await expect(back.getByTestId('tsp-wordmark')).toHaveText('piggybank.')
    await expect(sidebar(page)).not.toContainText('🐷')
    await expect(sidebar(page)).not.toContainText('Piggy Admin')
  })

  test('the nav holds one row; Settings lives in the footer', async ({ page }) => {
    await page.goto('/admin/piggy-banks')

    await expect(sidebar(page).getByTestId('tsp-nav-item')).toHaveCount(1)
    await expect(sidebar(page).getByTestId('tsp-nav-item')).toHaveAttribute('href', '/admin/piggy-banks')
    await expect(sidebar(page).getByRole('link', { name: 'Settings' })).toHaveAttribute('data-footer-row', 'settings')
  })

  test('the footer rows come from the layer', async ({ page }) => {
    await page.goto('/admin/piggy-banks')
    const footer = sidebar(page)

    await expect(footer.getByRole('link', { name: 'E2E Admin' })).toHaveAttribute('href', '/admin/user')
    await expect(footer.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/admin/settings')
    await expect(footer.getByRole('link', { name: 'Logout' })).toHaveAttribute('href', '/admin/sign-out')
    await expect(page.getByTestId('logto-account')).toHaveCount(0)
    // Not translated, not a tsp.tools product.
    await expect(footer.getByRole('group', { name: 'Language' })).toHaveCount(0)
    await expect(footer).not.toContainText('A tool of')
  })

  for (const { path, title } of [
    { path: '/admin/piggy-banks', title: 'Piggy Banks' },
    { path: '/admin/piggy-banks/new', title: 'Add piggy bank' },
    { path: '/admin/settings', title: 'Settings' },
    { path: '/admin/user', title: 'User' },
  ]) {
    test(`${path} opens with the layer's page header`, async ({ page }) => {
      await page.goto(path)
      await expect(heading(page)).toHaveCount(1)
      await expect(page.getByTestId('tsp-page-header')).toHaveText(title)
    })
  }

  test('the edit page opens with the layer\'s page header', async ({ page }) => {
    await page.goto('/admin/piggy-banks')
    await page.getByTestId('pb-row').first().getByRole('link').first().click()
    await page.waitForURL('**/edit')
    await expect(heading(page)).toHaveCount(1)
    await expect(page.getByTestId('tsp-page-header')).toHaveText('Edit piggy bank')
  })

  test('"Add piggy bank" sits on its own row under the header', async ({ page }) => {
    await page.goto('/admin/piggy-banks')
    const header = (await page.getByTestId('tsp-page-header').boundingBox())!
    const add = (await page.getByRole('link', { name: 'Add piggy bank' }).boundingBox())!
    expect(add.y).toBeGreaterThanOrEqual(header.y + header.height)
  })

  test('the back arrow sits on its own line above the header', async ({ page }) => {
    await page.goto('/admin/piggy-banks/new')
    const back = (await page.getByRole('link', { name: 'Back', exact: true }).boundingBox())!
    const header = (await page.getByTestId('tsp-page-header').boundingBox())!
    expect(back.y + back.height).toBeLessThanOrEqual(header.y)

    await page.getByRole('link', { name: 'Back', exact: true }).click()
    await page.waitForURL('**/admin/piggy-banks')
  })

  test('the user page is the layer\'s account page', async ({ page }) => {
    await page.goto('/admin/user')

    const card = page.getByTestId('tsp-user-card')
    await expect(page.getByTestId('tsp-account-page')).toBeVisible()
    await expect(card).toContainText('E2E Admin')
    await expect(card).toContainText('tsp.tools account')

    // The id is not rendered until revealed.
    await expect(card).not.toContainText('e2e-admin')
    await card.getByRole('button', { name: 'Show ID' }).click()
    await expect(card).toContainText('e2e-admin')
    await card.getByRole('button', { name: 'Hide ID' }).click()
    await expect(card).not.toContainText('e2e-admin')
  })

  test('the LNURL-auth line sits below the account card, not inside it', async ({ page }) => {
    // The e2e stack has no Logto userinfo, so the server never reports an
    // LNURL-auth identity. Answer the client-side fetch of a navigation instead.
    await page.goto('/admin/piggy-banks')
    await page.route('**/api/admin/me', route => route.fulfill({
      json: { sub: 'e2e-admin', name: 'E2E Admin', accountCenterUrl: null, lnurlAuth: true },
    }))
    await sidebar(page).getByRole('link', { name: 'E2E Admin' }).click()
    await page.waitForURL('**/admin/user')

    const status = page.getByTestId('lnurl-auth-status')
    await expect(status).toHaveText('Connected via LNURL-auth')
    await expect(page.getByTestId('tsp-user-card').getByTestId('lnurl-auth-status')).toHaveCount(0)
    const card = (await page.getByTestId('tsp-user-card').boundingBox())!
    expect((await status.boundingBox())!.y).toBeGreaterThanOrEqual(card.y + card.height)
  })
})

test.describe('admin shell at mobile width', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('the drawer opens, a navigation closes it, the top bar names the page', async ({ page }) => {
    await page.goto('/admin/piggy-banks')
    const title = page.getByTestId('tsp-top-bar-title')
    await expect(title).toHaveText('Piggy Banks')
    await expect(sidebar(page)).not.toBeInViewport()

    await page.getByTestId('tsp-burger').click()
    await expect(sidebar(page)).toBeInViewport()

    await sidebar(page).getByRole('link', { name: 'Settings' }).click()
    await page.waitForURL('**/admin/settings')
    await expect(title).toHaveText('Settings')
    await expect(sidebar(page)).not.toBeInViewport()
    await expect(page.getByTestId('tsp-nav-backdrop')).toHaveCount(0)
  })

  test('the top bar shows the page\'s chosen title, not one derived from the URL', async ({ page }) => {
    await page.goto('/admin/piggy-banks/new')
    await expect(page.getByTestId('tsp-top-bar-title')).toHaveText('Add piggy bank')
    await page.goto('/admin/user')
    await expect(page.getByTestId('tsp-top-bar-title')).toHaveText('User')
  })
})

test.describe('the public area keeps the Piggy style', () => {
  test('/ is light with the dodgerblue primary and no tsp scope', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveClass(/light/)
    await expect(page.locator('.tsp-theme')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Enter', exact: true })).toHaveCSS('background-color', DODGERBLUE_RGB)
  })

  test('/dashboard is light with the dodgerblue primary and no tsp scope', async ({ page }) => {
    await resetMock()
    await login(page)
    await expect(page.locator('html')).toHaveClass(/light/)
    await expect(page.locator('.tsp-theme')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Deposit' })).toHaveCSS('background-color', DODGERBLUE_RGB, { timeout: 15_000 })
  })
})

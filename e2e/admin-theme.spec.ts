import { test, expect, type Page } from '@playwright/test'

// Admin design-system theming (see admin-07-design-system spec). The admin area
// adopts the tsp platform tokens — dark by default, amber (#fbad18) primary,
// Nunito text — while the public area keeps the Piggy light theme. Colour mode
// is per-route, driven by the @thespielplatz/tsp-tools-theme layer (scoped mode).

// #fbad18, the amber primary, as the browser reports background-color.
const AMBER_RGB = 'rgb(251, 173, 24)'
// tsp surface backgrounds (--ui-bg) per mode: #212529 dark, #f8f9fa light.
const DARK_BG_RGB = 'rgb(33, 37, 41)'
const LIGHT_BG_RGB = 'rgb(248, 249, 250)'

const fontOf = (page: Page, selector: string) =>
  page.evaluate(sel => getComputedStyle(document.querySelector(sel)!).fontFamily, selector)

const loginAdmin = (page: Page) =>
  page.context().addCookies([{ name: 'e2e_admin', value: '1', domain: '127.0.0.1', path: '/' }])

test('public start page stays light with the Piggy theme', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(/light/)
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  // Piggy body font, not the admin Nunito.
  expect(await fontOf(page, 'body')).not.toContain('Nunito')
})

test('the /admin landing renders dark with amber primary and Nunito', async ({ page }) => {
  await page.goto('/admin')
  await expect(page.locator('html')).toHaveClass(/dark/)
  // The amber "Login as admin" CTA.
  const cta = page.getByRole('link', { name: /Login as admin/ })
  await expect(cta).toHaveCSS('background-color', AMBER_RGB)
  expect(await fontOf(page, 'h1')).toContain('Nunito')
})

test('admin pages render dark with amber primary and Nunito text', async ({ page }) => {
  await loginAdmin(page)

  await page.goto('/admin/piggy-banks')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByRole('link', { name: 'Add piggy bank' })).toHaveCSS('background-color', AMBER_RGB)
  expect(await fontOf(page, 'h1')).toContain('Nunito')

  await page.goto('/admin/settings')
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.goto('/admin/user')
  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('navigating between public and admin switches the theme and back', async ({ page }) => {
  // Start on the public start page — light.
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(/light/)

  // Into the admin area via the teaser link — switches to dark.
  await page.getByRole('link', { name: /Start here/ }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.locator('html')).toHaveClass(/dark/)

  // Back to the public start page via the admin backlink — restores light.
  await page.getByRole('link', { name: 'Back to Piggy Bank' }).click()
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/$/)
  await expect(page.locator('html')).toHaveClass(/light/)
})

test('the dark admin preference does not leak into the public area', async ({ page }) => {
  // Visit admin (persists a dark colour-mode preference), then load the public
  // start page directly — it must still come up light.
  await page.goto('/admin')
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(/light/)
})

test('admin defaults to dark and the sidebar toggle switches to light', async ({ page }) => {
  await loginAdmin(page)
  await page.goto('/admin/piggy-banks')

  // Default: dark surfaces, amber primary.
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('main')).toHaveCSS('background-color', DARK_BG_RGB)
  await expect(page.getByRole('link', { name: 'Add piggy bank' })).toHaveCSS('background-color', AMBER_RGB)

  // Toggle → light surfaces, but the primary stays amber.
  await page.getByTestId('tsp-theme-toggle').click()
  await expect(page.locator('html')).toHaveClass(/light/)
  await expect(page.locator('main')).toHaveCSS('background-color', LIGHT_BG_RGB)
  await expect(page.getByRole('link', { name: 'Add piggy bank' })).toHaveCSS('background-color', AMBER_RGB)
})

test('the admin light preference is remembered across a reload', async ({ page }) => {
  await loginAdmin(page)
  await page.goto('/admin/piggy-banks')
  await page.getByTestId('tsp-theme-toggle').click()
  await expect(page.locator('html')).toHaveClass(/light/)

  await page.reload()
  await expect(page.locator('html')).toHaveClass(/light/)
  await expect(page.locator('main')).toHaveCSS('background-color', LIGHT_BG_RGB)
})

test('the public area stays light even when admin is set to light', async ({ page }) => {
  await loginAdmin(page)
  await page.goto('/admin/piggy-banks')
  await page.getByTestId('tsp-theme-toggle').click()
  await expect(page.locator('html')).toHaveClass(/light/)

  // Public is always light regardless of the admin preference …
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(/light/)

  // … and returning to admin restores the remembered light choice.
  await page.goto('/admin/piggy-banks')
  await expect(page.locator('html')).toHaveClass(/light/)
})

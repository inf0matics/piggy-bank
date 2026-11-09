import { test, expect } from '@playwright/test'

test.describe('privacy policy', () => {
  test('/privacy returns 200 and shows the key sections', async ({ page }) => {
    const response = await page.goto('/privacy')
    expect(response?.status()).toBe(200)

    await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible()
    for (const section of ['Controller', 'Data processed', 'Cookies', 'Third-party services', 'Hosting', 'Retention', 'Your rights']) {
      await expect(page.getByRole('heading', { level: 2, name: section })).toBeVisible()
    }
    await expect(page.getByText('Schemerlhöhe 377, 8076 Vasoldsberg, Austria')).toBeVisible()
  })

  test('/privacy-policy permanently redirects to /privacy', async ({ request }) => {
    const response = await request.get('/privacy-policy', { maxRedirects: 0 })
    expect(response.status()).toBe(301)
    expect(new URL(response.headers().location!, 'http://x').pathname).toBe('/privacy')
  })

  test('the footer links to /privacy', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
  })
})

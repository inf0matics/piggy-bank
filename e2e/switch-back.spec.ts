import { test, expect, type Page } from '@playwright/test'
import { createPiggyBank, deleteByName, loginAsAdmin, type PiggyBank } from './helpers/admin'
import { login } from './helpers/login'
import { resetMock, setMockState } from './helpers/mockControl'

// A manual piggy bank goes back on LNBits after the custodian compared the two
// balances (spec admin-12). Each test freezes its own piggy bank at the mock's
// 100,000 sats and deletes it afterwards. The mock's Kraken ticker serves
// 1 BTC = 50,000 EUR, so 1 EUR = 2,000 sats.

const freeze = async (page: Page, name: string, accessKey: string): Promise<PiggyBank> => {
  const pb = await createPiggyBank(page, name, accessKey)
  await page.request.post(`/api/admin/piggy-banks/${pb.id}/manual`, { data: { sats: 100_000 } })
  return pb
}

const openSwitchBack = async (page: Page, pb: PiggyBank) => {
  await page.goto(`/admin/piggy-banks/${pb.id}/edit`)
  await page.getByTestId('balance-source').getByRole('button', { name: 'Switch back to LNBits' }).click()
  const dialog = page.getByRole('dialog')
  return { dialog, confirm: dialog.getByRole('button', { name: 'Switch to LNBits' }) }
}

const switchBack = (page: Page, id: string, data: unknown) =>
  page.request.post(`/api/admin/piggy-banks/${id}/lnbits`, { data })

const source = (page: Page, id: string) =>
  page.request.get(`/api/admin/piggy-banks/${id}`).then(r => r.json()).then(r => r.balance.source)

// Back on LNBits: the card offers the switch to manual again.
const expectOnLnbits = (page: Page) =>
  expect(page.getByTestId('balance-source').getByRole('button', { name: 'Switch to manual' })).toBeVisible()

// Records every toast the page shows from now on: a toast lasts 2 s, and the
// balance counts up for longer, so a toast could come and go unseen.
const recordToasts = (child: Page) => child.evaluate(() => {
  const seen: string[] = []
  ;(window as unknown as { seenToasts: string[] }).seenToasts = seen
  new MutationObserver((mutations) => {
    for (const node of mutations.flatMap(m => [...m.addedNodes])) {
      if (node instanceof Element && node.closest('[role="region"]')?.getAttribute('aria-label')?.includes('Notifications')) {
        if (node.textContent) seen.push(node.textContent)
      }
    }
  }).observe(document.body, { childList: true, subtree: true })
})
const seenToasts = (child: Page) => child.evaluate(() => (window as unknown as { seenToasts: string[] }).seenToasts)

test.beforeEach(async ({ page }) => {
  await resetMock()
  await loginAsAdmin(page)
})

test.afterAll(async () => {
  await resetMock()
})

test('equal balances switch back without extra confirmation', async ({ page }) => {
  const pb = await freeze(page, 'Equal', '6440')

  try {
    const { dialog, confirm } = await openSwitchBack(page, pb)
    await expect(dialog.getByTestId('balances-equal')).toContainText('100,000 sats')
    await expect(dialog.getByRole('checkbox')).toHaveCount(0)
    await confirm.click()
    await expectOnLnbits(page)

    // The balance is read from LNBits again.
    await setMockState({ balance: 123_456 })
    await login(page, '6440')
    await expect(page.getByTestId('sats-balance')).toHaveText('0.00123456 BTC', { timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Deposit' })).toBeVisible()
  } finally {
    await deleteByName(page, 'Equal')
  }
})

test('different balances show both and the difference, and need a deliberate confirmation', async ({ page }) => {
  await setMockState({ payment: { sats: 2_100, comment: 'Birthday' } })
  const pb = await freeze(page, 'Differ', '6441')
  // The wallet moved on while the piggy bank was manual.
  await setMockState({ balance: 150_000 })

  try {
    const child = await page.context().newPage()
    await login(child, '6441')
    await expect(child.getByTestId('sats-balance')).toHaveText('0.00100000 BTC', { timeout: 15_000 })
    await recordToasts(child)

    const { dialog, confirm } = await openSwitchBack(page, pb)
    const comparison = dialog.getByTestId('balance-comparison')
    await expect(comparison.getByTestId('compare-manual')).toHaveText('100,000 sats ≈ €50.00')
    await expect(comparison.getByTestId('compare-lnbits')).toHaveText('150,000 sats ≈ €75.00')
    await expect(comparison.getByTestId('compare-difference')).toHaveText('+50,000 sats ≈ +€25.00')
    await expect(confirm).toBeDisabled()
    await dialog.getByRole('checkbox').check()
    await confirm.click()
    await expectOnLnbits(page)

    // The child's dashboard follows LNBits, and the mismatch is not announced
    // as a payment: only the custodian sees it.
    await expect(child.getByTestId('sats-balance')).toHaveText('0.00150000 BTC', { timeout: 15_000 })
    await expect(child.getByRole('button', { name: 'Deposit' })).toBeVisible()
    // Polls keep coming (every 2 s): give one more the chance to toast.
    await child.waitForTimeout(3_000)
    expect(await seenToasts(child)).toEqual([])
  } finally {
    await deleteByName(page, 'Differ')
  }
})

test('LNBits unreachable: switching back is refused with a message and the piggy bank stays manual', async ({ page }) => {
  const pb = await freeze(page, 'Down', '6442')
  await setMockState({ reachable: false })

  try {
    const { dialog, confirm } = await openSwitchBack(page, pb)
    await expect(dialog.getByTestId('switch-back-refused')).toContainText('LNBits cannot be reached', { timeout: 10_000 })
    await expect(confirm).toBeDisabled()

    const response = await switchBack(page, pb.id, { manualSats: 100_000, lnbitsSats: 100_000 })
    expect(response.status()).toBe(503)
    expect(await source(page, pb.id)).toBe('manual')
  } finally {
    await deleteByName(page, 'Down')
  }
})

test('the stored LNBits key is used, and a changed one is used once saved', async ({ page }) => {
  const pb = await freeze(page, 'Rekeyed', '6443')
  const saveKey = (invoiceKey: string) => page.request.put(`/api/admin/piggy-banks/${pb.id}`, {
    data: { name: 'Rekeyed', accessKey: '6443', lnbitsUrl: 'http://lnbits-mock', invoiceKey },
  })

  try {
    expect((await saveKey('invalid-key')).status()).toBe(200)
    const refused = await openSwitchBack(page, pb)
    await expect(refused.dialog.getByTestId('switch-back-refused')).toContainText('LNBits refused the invoice key')
    await expect(refused.confirm).toBeDisabled()
    expect((await switchBack(page, pb.id, { manualSats: 100_000, lnbitsSats: 100_000 })).status()).toBe(502)

    expect((await saveKey('test-invoice-key')).status()).toBe(200)
    const { confirm } = await openSwitchBack(page, pb)
    await confirm.click()
    await expectOnLnbits(page)
    expect(await source(page, pb.id)).toBe('lnbits')
  } finally {
    await deleteByName(page, 'Rekeyed')
  }
})

test('the switch back is guarded: input, ownership, source and stale balances', async ({ page }) => {
  const pb = await freeze(page, 'Guarded back', '6444')

  try {
    for (const data of [{}, { manualSats: -1, lnbitsSats: 0 }, { manualSats: 1.5, lnbitsSats: 0 }]) {
      expect((await switchBack(page, pb.id, data)).status(), JSON.stringify(data)).toBe(400)
    }
    expect((await switchBack(page, 'other-owner-user', { manualSats: 0, lnbitsSats: 0 })).status()).toBe(404)

    // Balances that moved since the custodian compared them.
    const stale = await switchBack(page, pb.id, { manualSats: 100_000, lnbitsSats: 90_000 })
    expect(stale.status()).toBe(409)
    expect(await stale.json()).toMatchObject({ statusMessage: 'The LNBits balance is now 100,000 sats. Compare the balances again.' })
    expect((await switchBack(page, pb.id, { manualSats: 90_000, lnbitsSats: 100_000 })).status()).toBe(409)
    expect(await source(page, pb.id)).toBe('manual')

    expect((await switchBack(page, pb.id, { manualSats: 100_000, lnbitsSats: 100_000 })).status()).toBe(200)
    expect(await source(page, pb.id)).toBe('lnbits')
    // Already on LNBits.
    expect((await switchBack(page, pb.id, { manualSats: 100_000, lnbitsSats: 100_000 })).status()).toBe(409)
  } finally {
    await deleteByName(page, 'Guarded back')
  }
})

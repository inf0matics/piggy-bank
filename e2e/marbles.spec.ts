import { test, expect, type Page } from '@playwright/test'
import { deleteByName, loginAsAdmin, type PiggyBank } from './helpers/admin'
import { login } from './helpers/login'
import { MARBLES_URL, MARBLES_WALLET, marblesKey, marblesRequests, resetMarbles, setMarbles } from './helpers/marblesMock'
import { resetMock } from './helpers/mockControl'

// marbles as a balance source (spec admin-13). Each test makes its own piggy
// bank: created on the LNBits mock (100,000 sats) with marbles settings,
// frozen to manual at 100,000 sats, and from there switched to marbles where
// a test needs it. The marbles mock holds 100,000 sats by default. The LNBits
// mock's Kraken ticker serves 1 BTC = 50,000 EUR, so 1 EUR = 2,000 sats.
// The server caches marbles reads for 5 s, so dashboards follow the mock
// within that.

const BALANCE_TIMEOUT = { timeout: 15_000 }

const create = async (page: Page, name: string, accessKey: string, key = marblesKey()): Promise<PiggyBank> => {
  const response = await page.request.post('/api/admin/piggy-banks', {
    data: {
      name,
      accessKey,
      lnbitsUrl: 'http://lnbits-mock',
      invoiceKey: 'test-invoice-key',
      marblesUrl: MARBLES_URL,
      marblesKey: key,
      marblesWallet: MARBLES_WALLET,
    },
  })
  expect(response.status()).toBe(200)
  return response.json()
}

const toManual = (page: Page, pb: PiggyBank, sats = 100_000) =>
  page.request.post(`/api/admin/piggy-banks/${pb.id}/manual`, { data: { sats } })

const switchToMarbles = (page: Page, id: string, data: unknown) =>
  page.request.post(`/api/admin/piggy-banks/${id}/marbles`, { data })

/** A piggy bank reading its balance from marbles (100,000 sats). */
const onMarbles = async (page: Page, name: string, accessKey: string, key?: string) => {
  const pb = await create(page, name, accessKey, key)
  await toManual(page, pb)
  expect((await switchToMarbles(page, pb.id, { manualSats: 100_000, marblesSats: 100_000 })).status()).toBe(200)
  return pb
}

const source = (page: Page, id: string) =>
  page.request.get(`/api/admin/piggy-banks/${id}`).then(r => r.json()).then(r => r.balance.source)

const card = (page: Page) => page.getByTestId('balance-source')

const openSwitchToMarbles = async (page: Page, pb: PiggyBank) => {
  await page.goto(`/admin/piggy-banks/${pb.id}/edit`)
  await card(page).getByRole('button', { name: 'Switch to marbles' }).click()
  const dialog = page.getByRole('dialog')
  return { dialog, confirm: dialog.getByRole('button', { name: 'Switch to marbles' }) }
}

// On marbles: the card names it and offers the switch to manual.
const expectOnMarbles = async (page: Page) => {
  await expect(card(page).getByRole('button', { name: 'Switch to manual' })).toBeVisible()
  await expect(card(page)).toContainText('marbles')
}

test.beforeEach(async ({ page }) => {
  await Promise.all([resetMock(), resetMarbles()])
  await loginAsAdmin(page)
})

test.afterAll(async () => {
  await Promise.all([resetMock(), resetMarbles()])
})

test('manual → marbles with equal balances: one confirm, then the dashboard reads marbles', async ({ page }) => {
  await setMarbles({ payment: { sats: 2_100, comment: 'Birthday' } })
  const pb = await create(page, 'Marbles equal', '6450')
  await toManual(page, pb)

  try {
    const { dialog, confirm } = await openSwitchToMarbles(page, pb)
    await expect(dialog.getByTestId('balances-equal')).toContainText('100,000 sats')
    await expect(dialog.getByRole('checkbox')).toHaveCount(0)
    await confirm.click()
    await expectOnMarbles(page)
    expect(await source(page, pb.id)).toBe('marbles')

    await setMarbles({ balance: 123_456 })
    const child = await page.context().newPage()
    await login(child, '6450')
    await expect(child.getByTestId('sats-balance')).toHaveText('0.00123456 BTC', BALANCE_TIMEOUT)
    await expect(child.getByText('Message: Birthday')).toBeVisible()
    await expect(child.getByRole('button', { name: 'Deposit' })).toBeVisible()
  } finally {
    await deleteByName(page, 'Marbles equal')
  }
})

test('manual → marbles with different balances: both and the difference, and a deliberate confirm', async ({ page }) => {
  const pb = await create(page, 'Marbles differ', '6451')
  await toManual(page, pb)
  await setMarbles({ balance: 150_000 })

  try {
    const { dialog, confirm } = await openSwitchToMarbles(page, pb)
    const comparison = dialog.getByTestId('balance-comparison')
    await expect(comparison.getByTestId('compare-manual')).toHaveText('100,000 sats ≈ €50.00')
    await expect(comparison.getByTestId('compare-marbles')).toHaveText('150,000 sats ≈ €75.00')
    await expect(comparison.getByTestId('compare-difference')).toHaveText('+50,000 sats ≈ +€25.00')
    await expect(confirm).toBeDisabled()
    await dialog.getByRole('checkbox', { name: 'Use the marbles balance of 150,000 sats' }).check()
    await confirm.click()
    await expectOnMarbles(page)

    const child = await page.context().newPage()
    await login(child, '6451')
    await expect(child.getByTestId('sats-balance')).toHaveText('0.00150000 BTC', BALANCE_TIMEOUT)
  } finally {
    await deleteByName(page, 'Marbles differ')
  }
})

test('manual → marbles is refused while marbles is unreachable, or the key is refused or expired', async ({ page }) => {
  const cases = [
    { name: 'Marbles down', pin: '6452', key: marblesKey('down'), setup: { reachable: false }, message: 'marbles cannot be reached', status: 503 },
    { name: 'Marbles revoked', pin: '6453', key: marblesKey('revoked'), setup: {}, message: 'marbles refused the API key', status: 502 },
    { name: 'Marbles expired', pin: '6454', key: marblesKey('expired'), setup: {}, message: 'The marbles API key has expired', status: 502 },
  ]

  for (const c of cases) {
    await resetMarbles()
    const pb = await create(page, c.name, c.pin, c.key)
    await toManual(page, pb)
    await setMarbles(c.setup)

    try {
      const { dialog, confirm } = await openSwitchToMarbles(page, pb)
      await expect(dialog.getByTestId('switch-back-refused'), c.name).toContainText(c.message, { timeout: 10_000 })
      await expect(confirm).toBeDisabled()

      expect((await switchToMarbles(page, pb.id, { manualSats: 100_000, marblesSats: 100_000 })).status(), c.name).toBe(c.status)
      expect(await source(page, pb.id)).toBe('manual')
    } finally {
      await deleteByName(page, c.name)
    }
  }
})

test('marbles → manual freezes the marbles balance; the dashboard then needs no marbles', async ({ page }) => {
  const pb = await onMarbles(page, 'Marbles freeze', '6455')
  await setMarbles({ balance: 123_456, payment: { sats: 500, kind: 'operator-credit', description: 'Pocket money' } })

  try {
    await page.goto(`/admin/piggy-banks/${pb.id}/edit`)
    await card(page).getByRole('button', { name: 'Switch to manual' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByTestId('wallet-balance')).toContainText('The marbles balance is 123,456 sats')
    await dialog.getByRole('button', { name: 'Switch to manual' }).click()
    await expect(card(page).getByTestId('manual-balance')).toHaveText('123,456 sats')

    const child = await page.context().newPage()
    await login(child, '6455')
    await expect(child.getByTestId('sats-balance')).toHaveText('0.00123456 BTC', BALANCE_TIMEOUT)
    // The operator credit carried over as the last payment, with its note.
    await expect(child.getByText('Message: Pocket money')).toBeVisible()
    await expect(child.getByRole('button', { name: 'Deposit' })).toHaveCount(0)

    await setMarbles({ reachable: false })
    await child.waitForTimeout(3_000)
    await expect(child.getByTestId('sats-balance')).toHaveText('0.00123456 BTC')
    await expect(child.getByText('Balance currently unavailable')).toHaveCount(0)
  } finally {
    await deleteByName(page, 'Marbles freeze')
  }
})

test('a marbles dashboard says marbles is unavailable while it is down, and recovers', async ({ page }) => {
  await onMarbles(page, 'Marbles outage', '6456', marblesKey('outage'))

  try {
    const child = await page.context().newPage()
    await login(child, '6456')
    await expect(child.getByTestId('sats-balance')).toHaveText('0.00100000 BTC', BALANCE_TIMEOUT)

    await setMarbles({ reachable: false })
    await expect(child.getByText('Balance currently unavailable')).toBeVisible(BALANCE_TIMEOUT)
    await expect(child.getByRole('button', { name: 'Deposit' })).toHaveCount(0)

    await setMarbles({ reachable: true })
    await expect(child.getByTestId('sats-balance')).toHaveText('0.00100000 BTC', BALANCE_TIMEOUT)
  } finally {
    await deleteByName(page, 'Marbles outage')
  }
})

test('a 429 shows unavailable, and the key waits for Retry-After instead of hammering marbles', async ({ page }) => {
  await onMarbles(page, 'Marbles limited', '6457', marblesKey('limited'))

  try {
    const child = await page.context().newPage()
    await login(child, '6457')
    await expect(child.getByTestId('sats-balance')).toHaveText('0.00100000 BTC', BALANCE_TIMEOUT)

    await setMarbles({ retryAfter: 8 })
    await expect(child.getByText('Balance currently unavailable')).toBeVisible(BALANCE_TIMEOUT)

    // The dashboard keeps polling every 2 s; marbles is not asked meanwhile.
    const before = await marblesRequests()
    await child.waitForTimeout(4_000)
    expect(await marblesRequests()).toBe(before)

    await setMarbles({ retryAfter: null })
    await expect(child.getByTestId('sats-balance')).toHaveText('0.00100000 BTC', { timeout: 20_000 })
  } finally {
    await deleteByName(page, 'Marbles limited')
  }
})

test('test connection shows wallet, balance, pay link and key expiry, and warns about money-moving rights', async ({ page }) => {
  await page.goto('/admin/piggy-banks/new')
  await page.locator('#marblesUrl').fill(MARBLES_URL)
  await page.locator('#marblesKey').fill(marblesKey())
  await page.locator('#marblesWallet').fill(MARBLES_WALLET)
  const testButton = page.getByRole('button', { name: 'Test marbles connection' })
  const result = page.getByTestId('marbles-connection-result')

  await testButton.click()
  await expect(result).toContainText('Connected to the wallet “Piggy marbles”')
  await expect(result).toContainText('Balance 100,000 sats')
  await expect(result).toContainText('Active pay link')
  await expect(result).toContainText('Key expires Nov 13, 2027')
  await expect(result.getByTestId('marbles-risky-rights')).toHaveCount(0)

  await page.locator('#marblesKey').fill(marblesKey('payright'))
  await testButton.click()
  await expect(result.getByTestId('marbles-risky-rights')).toContainText('the right pay, which can move money out of the wallet')

  await setMarbles({ payLink: null })
  await page.locator('#marblesKey').fill(marblesKey('nolink'))
  await testButton.click()
  await expect(result).toContainText('No active pay link')

  for (const [field, value, message] of [
    ['#marblesKey', marblesKey('readonly'), 'lacks the right pay_links'],
    ['#marblesKey', marblesKey('expired'), 'The marbles API key has expired'],
    ['#marblesWallet', 'OtherWallet00001', 'does not reach this wallet'],
    ['#marblesUrl', 'http://does-not-exist.invalid', 'marbles cannot be reached'],
    ['#marblesKey', 'not-a-key', 'mbl_ followed by 43 characters'],
  ] as const) {
    await page.locator('#marblesUrl').fill(MARBLES_URL)
    await page.locator('#marblesKey').fill(marblesKey())
    await page.locator('#marblesWallet').fill(MARBLES_WALLET)
    await page.locator(field).fill(value)
    await testButton.click()
    await expect(result, value).toContainText(message)
  }
})

test('the admin list shows a marbles row with its pay link and last transaction', async ({ page }) => {
  await setMarbles({ payment: { sats: 2_100, comment: 'Birthday' } })
  await onMarbles(page, 'Marbles row', '6458', marblesKey('row'))

  try {
    await page.goto('/admin/piggy-banks')
    const row = page.locator('[data-testid="pb-row"]', { hasText: 'Marbles row' })
    await expect(row.getByTestId('pb-source')).toHaveText('marbles')
    await expect(row).toContainText('marbles-mock')
    await expect(row.locator('[data-lnurlp="active"]')).toContainText('Pay link')
    await expect(row).toContainText('Last tx')
    await expect(row.getByRole('button', { name: 'Deposit' })).toHaveAttribute('aria-disabled', 'false')
  } finally {
    await deleteByName(page, 'Marbles row')
  }
})

test('the default marbles URL pre-fills an empty marbles URL', async ({ page }) => {
  await page.request.put('/api/admin/settings', { data: { defaultLnbitsUrl: 'http://lnbits-mock', defaultMarblesUrl: MARBLES_URL } })

  try {
    await page.goto('/admin/settings')
    await expect(page.locator('#default-marbles-url')).toHaveValue(MARBLES_URL)
    await page.goto('/admin/piggy-banks/new')
    await expect(page.locator('#marblesUrl')).toHaveValue(MARBLES_URL)
  } finally {
    await page.request.put('/api/admin/settings', { data: { defaultLnbitsUrl: 'http://lnbits-mock', defaultMarblesUrl: '' } })
  }
})

test('marbles settings and switches are guarded', async ({ page }) => {
  const pb = await create(page, 'Marbles guarded', '6459')
  const save = (marbles: Record<string, string>) => page.request.put(`/api/admin/piggy-banks/${pb.id}`, {
    data: { name: 'Marbles guarded', accessKey: '6459', lnbitsUrl: 'http://lnbits-mock', invoiceKey: 'test-invoice-key', ...marbles },
  })
  const settings = { marblesUrl: MARBLES_URL, marblesKey: marblesKey(), marblesWallet: MARBLES_WALLET }

  try {
    // Not from LNBits directly: switching goes through manual.
    const direct = await switchToMarbles(page, pb.id, { manualSats: 100_000, marblesSats: 100_000 })
    expect(direct.status()).toBe(409)
    expect(await direct.json()).toMatchObject({ statusMessage: 'Piggy bank is on LNBits. Switch it to manual first.' })

    // Invalid settings are refused; a URL alone is no marbles connection.
    expect((await save({ ...settings, marblesWallet: '../../key/xxxxx' })).status()).toBe(400)
    expect((await save({ ...settings, marblesUrl: 'https://user:pw@marbles.example.com' })).status()).toBe(400)
    expect((await save({ marblesUrl: MARBLES_URL })).status()).toBe(200)

    await toManual(page, pb)
    const none = await switchToMarbles(page, pb.id, { manualSats: 100_000, marblesSats: 100_000 })
    expect(none.status()).toBe(409)
    expect(await none.json()).toMatchObject({ statusMessage: 'Save the marbles settings first.' })

    expect((await save(settings)).status()).toBe(200)
    for (const data of [{}, { manualSats: 100_000, marblesSats: -1 }, { manualSats: 100_000, lnbitsSats: 100_000 }]) {
      expect((await switchToMarbles(page, pb.id, data)).status(), JSON.stringify(data)).toBe(400)
    }
    expect((await switchToMarbles(page, 'other-owner-user', { manualSats: 0, marblesSats: 0 })).status()).toBe(404)
    const stale = await switchToMarbles(page, pb.id, { manualSats: 100_000, marblesSats: 90_000 })
    expect(stale.status()).toBe(409)
    expect(await stale.json()).toMatchObject({ statusMessage: 'The marbles balance is now 100,000 sats. Compare the balances again.' })
    expect(await source(page, pb.id)).toBe('manual')

    expect((await switchToMarbles(page, pb.id, { manualSats: 100_000, marblesSats: 100_000 })).status()).toBe(200)
    expect((await switchToMarbles(page, pb.id, { manualSats: 100_000, marblesSats: 100_000 })).status()).toBe(409)
    const toLnbits = await page.request.post(`/api/admin/piggy-banks/${pb.id}/lnbits`, { data: { manualSats: 100_000, lnbitsSats: 100_000 } })
    expect(toLnbits.status()).toBe(409)
    expect(await toLnbits.json()).toMatchObject({ statusMessage: 'Piggy bank is on marbles. Switch it to manual first.' })

    // On marbles, its settings cannot be removed, but can be changed.
    expect((await save({ marblesUrl: MARBLES_URL })).status()).toBe(409)
    expect((await save({ ...settings, marblesKey: marblesKey('rotated') })).status()).toBe(200)
    expect(await source(page, pb.id)).toBe('marbles')
  } finally {
    await deleteByName(page, 'Marbles guarded')
  }
})

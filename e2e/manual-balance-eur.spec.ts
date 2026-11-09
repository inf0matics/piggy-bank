import { test, expect, type Page } from '@playwright/test'
import { createPiggyBank, deleteByName, loginAsAdmin, type PiggyBank } from './helpers/admin'
import { login } from './helpers/login'
import { resetMock, setMockState } from './helpers/mockControl'

// A manual piggy bank's balance is changed in EUR: a plain amount sets it, +/-
// adds or subtracts (spec admin-11). The mock's Kraken ticker serves 1 BTC =
// 50,000 EUR, so 1 EUR = 2,000 sats. Each test freezes its own piggy bank at
// 100,000 sats (= 50 EUR) and deletes it afterwards.

const freeze = async (page: Page, name: string, accessKey: string): Promise<PiggyBank> => {
  const pb = await createPiggyBank(page, name, accessKey)
  await page.request.post(`/api/admin/piggy-banks/${pb.id}/manual`, { data: { sats: 100_000 } })
  return pb
}

const changeForm = async (page: Page, pb: PiggyBank) => {
  await page.goto(`/admin/piggy-banks/${pb.id}/edit`)
  const card = page.getByTestId('balance-source')
  return {
    card,
    amount: card.getByLabel('Change balance (EUR)'),
    comment: card.getByLabel('Comment (optional)'),
    preview: card.getByTestId('balance-preview'),
    error: card.getByTestId('balance-change-error'),
    confirm: card.getByRole('button', { name: 'Update balance' }),
  }
}

// The child's dashboard, open before the change so the next poll sees it.
const openDashboard = async (page: Page, accessKey: string, btc: string) => {
  const child = await page.context().newPage()
  await login(child, accessKey)
  await expect(child.getByTestId('sats-balance')).toHaveText(btc, { timeout: 15_000 })
  return child
}

const toasts = (child: Page) => child.getByRole('region', { name: /Notifications/ })

test.beforeEach(async ({ page }) => {
  await resetMock()
  await loginAsAdmin(page)
})

test.afterAll(async () => {
  await resetMock()
})

test('+10 previews at the current rate, raises the balance and toasts the comment', async ({ page }) => {
  const pb = await freeze(page, 'Added', '6430')

  try {
    const child = await openDashboard(page, '6430', '0.00100000 BTC')
    const form = await changeForm(page, pb)

    await form.amount.fill('+10')
    await form.comment.fill('Pocket money')
    await expect(form.preview).toHaveText('+€10.00 ≈ +20,000 sats at €50,000 / BTC → new balance 120,000 sats (≈ €60.00)')
    await form.confirm.click()

    await expect(page.getByTestId('manual-balance')).toHaveText('120,000 sats')
    await expect(form.amount).toHaveValue('')

    await expect(child.getByTestId('sats-balance')).toHaveText('0.00120000 BTC', { timeout: 15_000 })
    await expect(toasts(child).getByText('Pocket money')).toBeVisible()
    await expect(toasts(child).getByText('+20000 sats')).toBeVisible()
    // "Last payment" shows this change.
    await expect(child.getByText('Last Payment')).toBeVisible()
    await expect(child.getByText('0.00020000 BTC')).toBeVisible()
  } finally {
    await deleteByName(page, 'Added')
  }
})

test('a top-up of an empty piggy bank toasts too', async ({ page }) => {
  const pb = await createPiggyBank(page, 'Empty', '6436')
  await page.request.post(`/api/admin/piggy-banks/${pb.id}/manual`, { data: { sats: 0 } })

  try {
    const child = await openDashboard(page, '6436', '0.00000000 BTC')
    const form = await changeForm(page, pb)

    await form.amount.fill('+10')
    await form.confirm.click()

    await expect(child.getByTestId('sats-balance')).toHaveText('0.00020000 BTC', { timeout: 15_000 })
    await expect(toasts(child).getByText('+20000 sats')).toBeVisible()
  } finally {
    await deleteByName(page, 'Empty')
  }
})

test('-10 lowers the balance without a payment toast', async ({ page }) => {
  const pb = await freeze(page, 'Subtracted', '6431')

  try {
    const child = await openDashboard(page, '6431', '0.00100000 BTC')
    const form = await changeForm(page, pb)

    await form.amount.fill('-10')
    await form.comment.fill('Typo')
    await expect(form.preview).toHaveText('-€10.00 ≈ -20,000 sats at €50,000 / BTC → new balance 80,000 sats (≈ €40.00)')
    await form.confirm.click()

    await expect(page.getByTestId('manual-balance')).toHaveText('80,000 sats')
    await expect(child.getByTestId('sats-balance')).toHaveText('0.00080000 BTC', { timeout: 15_000 })
    await expect(child.getByText('-0.00020000 BTC')).toBeVisible()
    // The toast would show in the same poll as the new balance.
    await expect(toasts(child).getByText('Typo')).toHaveCount(0)
    await expect(toasts(child).getByText(/sats/)).toHaveCount(0)
  } finally {
    await deleteByName(page, 'Subtracted')
  }
})

test('a plain 25 sets the balance to the sats equivalent of 25 EUR', async ({ page }) => {
  const pb = await freeze(page, 'Set', '6432')

  try {
    const form = await changeForm(page, pb)

    await form.amount.fill('25')
    await expect(form.preview).toHaveText('New balance €25.00 ≈ 50,000 sats at €50,000 / BTC (-50,000 sats)')
    await form.confirm.click()

    await expect(page.getByTestId('manual-balance')).toHaveText('50,000 sats')
    const record = await page.request.get(`/api/admin/piggy-banks/${pb.id}`).then(r => r.json())
    expect(record.balance).toMatchObject({ source: 'manual', sats: 50_000, lastChange: { sats: -50_000, comment: null } })
  } finally {
    await deleteByName(page, 'Set')
  }
})

test('a change that would make the balance negative is refused', async ({ page }) => {
  const pb = await freeze(page, 'Negative', '6433')
  const change = (data: unknown) => page.request.post(`/api/admin/piggy-banks/${pb.id}/balance`, { data })

  try {
    const form = await changeForm(page, pb)

    await form.amount.fill('-60')
    await expect(form.error).toHaveText('The balance cannot go below zero')
    await expect(form.preview).toHaveCount(0)
    await expect(form.confirm).toBeDisabled()

    // The API refuses it too, and guards its input and ownership.
    const refused = await change({ mode: 'add', sats: -100_001 })
    expect(refused.status()).toBe(400)
    expect((await refused.json()).statusMessage).toBe('The balance cannot go below zero')
    for (const data of [{ mode: 'set', sats: -1 }, { mode: 'add', sats: 1.5 }, { mode: 'add', sats: '10' }, { mode: 'add', sats: 1, comment: 'x'.repeat(201) }]) {
      expect((await change(data)).status(), JSON.stringify(data)).toBe(400)
    }
    expect((await page.request.post('/api/admin/piggy-banks/other-owner-user/balance', { data: { mode: 'add', sats: 1 } })).status()).toBe(404)

    const record = await page.request.get(`/api/admin/piggy-banks/${pb.id}`).then(r => r.json())
    expect(record.balance.sats).toBe(100_000)
  } finally {
    await deleteByName(page, 'Negative')
  }
})

test('without a BTC/EUR rate no change can be confirmed, and the admin says why', async ({ page }) => {
  const pb = await freeze(page, 'Rateless', '6434')
  await setMockState({ rateAvailable: false })

  try {
    const form = await changeForm(page, pb)

    await expect(form.card.getByTestId('rate-unavailable')).toHaveText(/No BTC\/EUR rate is available right now/)
    await form.amount.fill('+10')
    await expect(form.preview).toHaveCount(0)
    await expect(form.confirm).toBeDisabled()
  } finally {
    await deleteByName(page, 'Rateless')
  }
})

test('the field is not offered for a piggy bank on LNbits', async ({ page }) => {
  const pb = await createPiggyBank(page, 'OnLnbits', '6435')

  try {
    const form = await changeForm(page, pb)

    await expect(form.card.getByRole('button', { name: 'Switch to manual' })).toBeVisible()
    await expect(form.amount).toHaveCount(0)
    expect((await page.request.post(`/api/admin/piggy-banks/${pb.id}/balance`, { data: { mode: 'add', sats: 1 } })).status()).toBe(409)
  } finally {
    await deleteByName(page, 'OnLnbits')
  }
})

import type { Page } from '@playwright/test'

// Admin helpers for tests that create their own piggy banks on the mock (the
// shared seed users stay untouched) and delete them afterwards.

export interface PiggyBank {
  id: string
  name: string
}

/** The e2e auth shim: this cookie counts as a signed-in custodian. */
export const loginAsAdmin = (page: Page) => page.context().addCookies([{
  name: 'e2e_admin',
  value: '1',
  domain: '127.0.0.1',
  path: '/',
}])

export const createPiggyBank = (page: Page, name: string, accessKey: string) =>
  page.request.post('/api/admin/piggy-banks', {
    data: { name, accessKey, lnbitsUrl: 'http://lnbits-mock', invoiceKey: 'test-invoice-key' },
  }).then(r => r.json()) as Promise<PiggyBank>

export const deleteByName = async (page: Page, name: string) => {
  const list = await page.request.get('/api/admin/piggy-banks').then(r => r.json()) as PiggyBank[]
  for (const pb of list.filter(p => p.name === name)) {
    await page.request.delete(`/api/admin/piggy-banks/${pb.id}`)
  }
}

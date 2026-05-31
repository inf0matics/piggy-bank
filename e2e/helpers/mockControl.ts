// Helper for driving the lnbits-mock test control API from tests (Node context).
// The mock's control endpoints are reached on the host-mapped port.

const MOCK_URL = process.env.LNBITS_MOCK_URL || 'http://localhost:5001'

export interface MockState {
  balance?: number // sats
  username?: string | null
  lnurl?: string | null
  rate?: number // BTC/EUR
  payment?: { sats: number, comment?: string | null } | null
}

const post = async (path: string, body?: unknown) => {
  const res = await fetch(`${MOCK_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`mock control ${path} failed: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

/** Restore the mock to its default state (100,000 sats, active lnurl, no payment). */
export const resetMock = () => post('/test/reset')

/** Override specific state fields on the mock. */
export const setMockState = (state: MockState) => post('/test/set', state)

/** Simulate an incoming payment: increments the balance and records it as the last payment. */
export const triggerPayment = (sats: number, comment?: string) =>
  post('/test/payment', { sats, comment })

// Helper for driving the marbles-mock control API from tests (Node context),
// and the marbles settings the app reaches the mock with.

const MOCK_URL = process.env.MARBLES_MOCK_URL || 'http://127.0.0.1:5002'

/** Where the app reaches the mock (Docker network). */
export const MARBLES_URL = 'http://marbles-mock'
/** The one wallet every mock key reaches. */
export const MARBLES_WALLET = 'PiggyWallet00001'

/**
 * A key in marbles' format. Its start chooses the mock's behaviour: `expired`,
 * `revoked`, `payright` (has `pay`), `readonly` (no `pay_links`); anything
 * else is a good key. A test of its own key keeps its cache and rate-limit
 * wait apart from the other tests'.
 */
export const marblesKey = (kind = 'piggy') => `mbl_${kind.padEnd(43, '0')}`

export interface MarblesMockState {
  balance?: number // sats
  payLink?: { lnurl?: string | null, address?: string | null } | null
  payment?: { sats: number, comment?: string | null, kind?: string, description?: string | null, direction?: 'in' | 'out', daysAgo?: number } | null
  reachable?: boolean // false: the API drops the connection
  retryAfter?: number | null // seconds: every API call answers 429 with this Retry-After
}

const call = async (method: 'GET' | 'POST', path: string, body?: unknown) => {
  const res = await fetch(`${MOCK_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`marbles mock control ${path} failed: ${res.status} ${res.statusText}`)
  return res.json()
}

/** Restore the default: 100,000 sats, a pay link, no transaction, reachable. */
export const resetMarbles = () => call('POST', '/test/reset')

export const setMarbles = (state: MarblesMockState) => call('POST', '/test/set', state)

/** An incoming LNURL-pay: raises the balance and becomes the last transaction. */
export const marblesPayment = (sats: number, comment?: string) => call('POST', '/test/payment', { sats, comment })

/** API calls the mock received since the last reset. */
export const marblesRequests = async (): Promise<number> => (await call('GET', '/test/requests')).count

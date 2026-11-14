import { z } from 'zod'
import type { BalanceChange } from '../domain/user.ts'
import type { WalletRead } from '../../utils/switchBack.ts'

// A piggy bank's marbles wallet (spec admin-13), read through the marbles API
// v1 (marbles/docs/api/openapi.yaml). marbles allows 120 requests per minute
// per key and keys may be shared, so reads are cached per wallet and key, and
// concurrent callers share one fetch. The app follows marbles' stability
// rules: unknown fields and enum values are ignored, only documented query
// parameters are sent, and amounts must be msat integer strings.

export interface MarblesConnection {
  url: string
  key: string
  wallet: string
}

/**
 * Why marbles gave no usable answer: `unreachable` (network, timeout, 5xx,
 * non-JSON, rate limited), `refused` (unknown key, a wallet the key does not
 * reach, or archived), `expired` (the key expired), `forbidden` (the key lacks
 * the right), `malformed` (JSON that is not what the contract promises).
 */
export type MarblesFailure = 'unreachable' | 'refused' | 'expired' | 'forbidden' | 'malformed'

export class MarblesError extends Error {
  reason: MarblesFailure

  constructor(reason: MarblesFailure, message: string, options?: ErrorOptions) {
    super(`marbles ${reason}: ${message}`, options)
    this.name = 'MarblesError'
    this.reason = reason
  }
}

/** Whether `error` says marbles could not be reached (as opposed to refusing). */
export const isUnreachable = (error: unknown): boolean => error instanceof MarblesError && error.reason === 'unreachable'

// As for LNBits: long enough for a healthy marbles, short enough that a page
// waiting on a dead one does not feel frozen.
const TIMEOUT_MS = 3_000
const BALANCE_TTL_MS = 5_000
// Pay links rarely change.
const PAY_LINKS_TTL_MS = 60_000
// How long a key waits after a 429 without a readable Retry-After.
const DEFAULT_RETRY_AFTER_MS = 60_000

const Msat = z.string().regex(/^(0|[1-9]\d*)$/)

/** Whole sats from an msat integer string, rounded down (BigInt: exact beyond 2^53 msat). */
const msatToSats = (msat: string): number => Number(BigInt(msat) / BigInt(1000))

const WalletAnswer = z.object({
  name: z.string(),
  balance_msat: Msat,
})

const TransactionsAnswer = z.object({
  transactions: z.array(z.object({
    direction: z.string(),
    amount_msat: Msat,
    amount_paid_msat: Msat.nullable(),
    description: z.string().nullish(),
    settled_at: z.string().refine(time => !Number.isNaN(Date.parse(time))),
    lnurl_params: z.object({ comment: z.string().optional() }).nullish(),
  })),
})

const PayLinksAnswer = z.object({
  pay_links: z.array(z.object({
    active: z.boolean(),
    lnurl: z.string().nullable(),
    address: z.string().nullable(),
  })),
})

const KeyAnswer = z.object({
  wallets: z.array(z.object({ id: z.string(), name: z.string() })),
  rights: z.array(z.string()),
  expires_at: z.string().nullable(),
})

// --- Requests ---

// When each key (URL + key) may ask marbles again after a 429.
const blockedUntil = new Map<string, number>()

const retryAfterMs = (header: string | null): number => {
  if (header && /^\d+$/.test(header.trim())) return Number(header.trim()) * 1000
  const date = header ? Date.parse(header) : Number.NaN
  return Number.isNaN(date) ? DEFAULT_RETRY_AFTER_MS : Math.max(0, date - Date.now())
}

const keyId = (conn: MarblesConnection) => `${conn.url}\n${conn.key}`

const request = async (conn: MarblesConnection, path: string): Promise<unknown> => {
  const until = blockedUntil.get(keyId(conn))
  if (until !== undefined) {
    if (Date.now() < until) throw new MarblesError('unreachable', 'rate limited, waiting for Retry-After')
    blockedUntil.delete(keyId(conn))
  }

  let response: Response
  let text: string
  try {
    response = await fetch(`${conn.url}/api/v1${path}`, {
      headers: { Authorization: `Bearer ${conn.key}`, Accept: 'application/json' },
      // marbles never redirects its API; following one would carry the key along.
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    text = await response.text()
  } catch (error) {
    throw new MarblesError('unreachable', conn.url, { cause: error })
  }

  if (response.status === 429) {
    blockedUntil.set(keyId(conn), Date.now() + retryAfterMs(response.headers.get('retry-after')))
    throw new MarblesError('unreachable', 'rate limited')
  }
  if (response.status >= 500) throw new MarblesError('unreachable', `${response.status}`)

  let body: unknown
  try {
    body = JSON.parse(text)
  } catch (error) {
    throw new MarblesError('unreachable', `non-JSON answer (${response.status})`, { cause: error })
  }
  if (response.ok) return body

  const code = z.object({ error: z.object({ code: z.string() }) }).safeParse(body).data?.error.code
  if (response.status === 401 && code === 'key_expired') throw new MarblesError('expired', 'key_expired')
  if (response.status === 403) throw new MarblesError('forbidden', code ?? '403')
  throw new MarblesError('refused', code ?? `${response.status}`)
}

const parse = <T>(schema: z.ZodType<T>, body: unknown): T => {
  const parsed = schema.safeParse(body)
  if (!parsed.success) throw new MarblesError('malformed', parsed.error.issues[0]?.message ?? 'unexpected answer')
  return parsed.data
}

// --- Cache ---

const cache = new Map<string, { expires: number, value: Promise<unknown> }>()

/**
 * The cached read under `id`, or a new one kept for `ttlMs` (failures too, so
 * a dead marbles is not asked on every poll). `fresh` always asks marbles and
 * caches that answer.
 */
const cached = <T>(id: string, ttlMs: number, read: () => Promise<T>, fresh = false): Promise<T> => {
  const now = Date.now()
  const hit = cache.get(id)
  if (!fresh && hit && hit.expires > now) return hit.value as Promise<T>
  for (const [key, entry] of cache) {
    if (entry.expires <= now) cache.delete(key)
  }
  const value = read()
  cache.set(id, { expires: now + ttlMs, value })
  return value
}

const walletId = (conn: MarblesConnection, what: string) => `${keyId(conn)}\n${conn.wallet}\n${what}`
const walletPath = (conn: MarblesConnection) => `/wallets/${encodeURIComponent(conn.wallet)}`

/** Forgets every cached read and rate-limit wait (tests). */
export const resetMarblesCache = (): void => {
  cache.clear()
  blockedUntil.clear()
}

// --- Reads ---

/** The wallet's name and balance in whole sats (rounded down). */
export const readWallet = (conn: MarblesConnection, { fresh = false } = {}): Promise<{ name: string, sats: number }> =>
  cached(walletId(conn, 'wallet'), BALANCE_TTL_MS, async () => {
    const wallet = parse(WalletAnswer, await request(conn, walletPath(conn)))
    return { name: wallet.name, sats: msatToSats(wallet.balance_msat) }
  }, fresh)

/**
 * The newest settled transaction, as marbles orders them, as a change in whole
 * sats (negative out of the wallet); null when there is none. Operator
 * adjustments count like any other payment.
 */
export const readLastPayment = (conn: MarblesConnection, { fresh = false } = {}): Promise<BalanceChange | null> =>
  cached(walletId(conn, 'last-payment'), BALANCE_TTL_MS, async () => {
    const { transactions } = parse(TransactionsAnswer, await request(conn, `${walletPath(conn)}/transactions?limit=1&status=settled`))
    const last = transactions[0]
    if (!last) return null
    const sats = msatToSats(last.amount_paid_msat ?? last.amount_msat)
    return {
      time: Math.floor(Date.parse(last.settled_at) / 1000),
      sats: last.direction === 'out' ? -sats : sats,
      comment: last.lnurl_params?.comment || last.description || null,
    }
  }, fresh)

/**
 * The deposit option: the newest active pay link's LNURL and Lightning
 * address. Null without an active link, without an LNURL (marbles has no
 * public URL set), or when the key lacks the `pay_links` right.
 */
export const readDeposit = (conn: MarblesConnection, { fresh = false } = {}): Promise<{ lnurl: string, address: string | null } | null> =>
  cached(walletId(conn, 'pay-links'), PAY_LINKS_TTL_MS, async () => {
    let body: unknown
    try {
      body = await request(conn, `${walletPath(conn)}/pay-links`)
    } catch (error) {
      if (error instanceof MarblesError && error.reason === 'forbidden') return null
      throw error
    }
    const link = parse(PayLinksAnswer, body).pay_links.find(l => l.active)
    return link?.lnurl ? { lnurl: link.lnurl, address: link.address } : null
  }, fresh)

export interface MarblesKey {
  wallets: Array<{ id: string, name: string }>
  rights: string[]
  expiresAt: string | null
}

/** The calling key: the wallets it reaches, its rights and expiry. Never cached. */
export const readKey = async (conn: MarblesConnection): Promise<MarblesKey> => {
  const key = parse(KeyAnswer, await request(conn, '/key'))
  return { wallets: key.wallets, rights: key.rights, expiresAt: key.expires_at }
}

// What the piggy bank reads with: the balance and transactions, and the pay links.
const NEEDED_RIGHTS = ['read', 'pay_links']
// Rights that can move money out of the wallet, which the piggy bank never needs.
const RISKY_RIGHTS = ['pay', 'withdraw_links']

/**
 * Whether `key` can serve the piggy bank's wallet: it must reach the wallet
 * and have `read` and `pay_links`. Names the rights it has beyond what the
 * piggy bank needs that can move money.
 */
export const checkKeyFor = (key: MarblesKey, wallet: string): { ok: true, walletName: string, riskyRights: string[] } | { ok: false, error: string } => {
  const reached = key.wallets.find(w => w.id === wallet)
  if (!reached) {
    return { ok: false, error: 'The API key does not reach this wallet. Check the wallet id, or add the wallet to the key in marbles.' }
  }
  const missing = NEEDED_RIGHTS.filter(right => !key.rights.includes(right))
  if (missing.length > 0) {
    return { ok: false, error: `The API key lacks the right${missing.length > 1 ? 's' : ''} ${missing.join(' and ')}. The piggy bank needs read and pay_links.` }
  }
  return { ok: true, walletName: reached.name, riskyRights: RISKY_RIGHTS.filter(right => key.rights.includes(right)) }
}

/**
 * The wallet balance for a switch, read fresh, or why marbles could not give
 * it: unreachable, an expired key, or refused (any other failure, a malformed
 * answer included).
 */
export const readMarblesWalletSats = async (conn: MarblesConnection): Promise<WalletRead> => {
  try {
    return { sats: (await readWallet(conn, { fresh: true })).sats }
  } catch (error) {
    const reason = error instanceof MarblesError ? error.reason : 'refused'
    return { sats: null, reason: reason === 'unreachable' || reason === 'expired' ? reason : 'refused' }
  }
}

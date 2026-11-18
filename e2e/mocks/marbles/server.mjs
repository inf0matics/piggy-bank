// Minimal marbles mock for E2E tests (spec admin-13), next to the LNBits mock.
//
// Implements only the marbles API v1 endpoints piggybank calls (see
// server/utils/Marbles.ts), with marbles' strictness: a key must be
// `mbl_` + 43 characters, a wallet the key does not reach answers 404, and
// undocumented query parameters answer 400.
//   GET /api/v1/key                                     -> { label, wallets, rights, expires_at, … }
//   GET /api/v1/wallets/:wallet                         -> { name, balance_msat, … }
//   GET /api/v1/wallets/:wallet/transactions?limit&status&from&to -> { transactions, next_cursor, range }
//     always within a range, as marbles: without `from`, the 30 days before `to` or now
//   GET /api/v1/wallets/:wallet/pay-links               -> { pay_links }
//
// The key's first characters after `mbl_` choose how marbles treats it:
//   expired…  -> 401 key_expired          revoked… -> 401 unauthorized
//   payright… -> rights read, pay_links, pay (the admin warns about it)
//   readonly… -> right read only (pay links answer 403)
//   anything else -> rights read and pay_links
// Every key reaches the one wallet WALLET.
//
// Test-only control API (NOT part of marbles):
//   POST /test/reset    -> restore the default state
//   POST /test/set      -> { balance, payLink, payment, reachable, retryAfter }
//                          payLink: null (none) | { lnurl, address }
//                          payment: null | { sats, comment, kind, description, direction, daysAgo }
//                          retryAfter: null | seconds — every API call answers 429 with it
//   POST /test/payment  -> an incoming LNURL-pay { sats, comment }
//   GET  /test/requests -> { count }: API calls received since the last reset
//   GET  /health
//
// State is in-memory. The app reaches the mock at http://marbles-mock; the
// control API is reached from the host on the mapped port.

import { createServer } from 'node:http'

const PORT = Number(process.env.PORT || 80)
const WALLET = 'PiggyWallet00001'
const KEY_PATTERN = /^mbl_[\w-]{43}$/

const defaultState = () => ({
  balanceSats: 100_000,
  payLink: { lnurl: 'LNURL1DP68GURN8GHJ7MRWW4EXCTNXD9SHG6NPVCHXXMMD9AKXUATJD3CZ7MOCKMARBLES', address: 'piggy@marbles-mock' },
  // { amountSats, comment, kind, description, direction, settledAt } | null
  lastTx: null,
  // false: the API drops the connection (marbles is down).
  reachable: true,
  // Seconds: every API call answers 429 rate_limited with this Retry-After.
  retryAfter: null,
  requests: 0,
})

let state = defaultState()

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers })
  res.end(body === undefined ? '' : JSON.stringify(body))
}
const error = (res, status, code, headers) => send(res, status, { error: { code, message: code } }, headers)

const readJson = req =>
  new Promise((resolve) => {
    let raw = ''
    req.on('data', chunk => (raw += chunk))
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        resolve({})
      }
    })
  })

const msat = sats => String(sats * 1000)
const DAY_MS = 86_400_000
// marbles reads transactions within the 30 days before `to` (or now) unless `from` says otherwise.
const RANGE_DAYS = 30

const rightsOf = (key) => {
  if (key.startsWith('mbl_payright')) return ['read', 'pay_links', 'pay']
  if (key.startsWith('mbl_readonly')) return ['read']
  return ['read', 'pay_links']
}

const transaction = tx => ({
  id: 'Tx2bQf0cJm4nE1Ab',
  kind: tx.kind,
  status: 'settled',
  direction: tx.direction,
  interface: tx.kind.startsWith('operator') ? 'cli' : 'lnurl',
  key_label: null,
  amount_msat: msat(tx.amountSats),
  amount_paid_msat: tx.kind === 'lnurl-pay' ? msat(tx.amountSats) : null,
  fee_estimate_msat: null,
  fee_reserve_msat: null,
  fee_paid_msat: null,
  description: tx.description,
  bolt11: null,
  payment_hash: null,
  preimage: null,
  destination: null,
  invoice_expires_at: null,
  created_at: tx.settledAt,
  settled_at: tx.settledAt,
  settled_after_expiry: false,
  expired_by_operator_at: null,
  expired_unreachable_node_id: null,
  attempts: null,
  route: null,
  internal: false,
  failure_reason: null,
  failure_code: null,
  lnurl: null,
  lnurl_params: tx.kind === 'lnurl-pay' ? { link: 'Lk3fQ0pBc9dZrWa1LeTxQ0pBc9dZrWa1LeTxQ0pBc9d', ...(tx.comment ? { comment: tx.comment } : {}) } : null,
})

const recordTx = (payment) => {
  state.lastTx = payment
    ? {
        amountSats: Number(payment.sats ?? 0),
        comment: payment.comment ?? null,
        kind: payment.kind ?? 'lnurl-pay',
        description: payment.description ?? null,
        direction: payment.direction ?? 'in',
        settledAt: new Date(Date.now() - Number(payment.daysAgo ?? 0) * DAY_MS).toISOString(),
      }
    : null
}

// The marbles API v1, as piggybank calls it.
const api = (req, res, url) => {
  state.requests += 1
  if (!state.reachable) return req.socket.destroy()
  if (state.retryAfter !== null) return error(res, 429, 'rate_limited', { 'Retry-After': String(state.retryAfter) })

  const key = /^Bearer (\S+)$/.exec(req.headers.authorization ?? '')?.[1] ?? ''
  if (!KEY_PATTERN.test(key) || key.startsWith('mbl_revoked')) return error(res, 401, 'unauthorized')
  if (key.startsWith('mbl_expired')) return error(res, 401, 'key_expired')

  const path = url.pathname.slice('/api/v1'.length)
  const query = [...url.searchParams.keys()]
  const allowed = path.endsWith('/transactions') ? ['limit', 'cursor', 'kind', 'status', 'from', 'to'] : []
  if (query.some(name => !allowed.includes(name))) return error(res, 400, 'invalid_request')

  if (req.method === 'GET' && path === '/key') {
    return send(res, 200, {
      label: 'piggy-bank',
      wallets: [{ id: WALLET, name: 'Piggy marbles' }],
      rights: rightsOf(key),
      created_at: '2026-11-13T00:00:00.000Z',
      expires_at: '2027-11-13T12:00:00.000Z',
      api_version: '1.0',
    })
  }

  const match = /^\/wallets\/([^/]+)(\/transactions|\/pay-links)?$/.exec(path)
  if (req.method !== 'GET' || !match) return error(res, 404, 'not_found')
  if (match[1] !== WALLET) return error(res, 404, 'not_found')

  switch (match[2]) {
    case undefined:
      return send(res, 200, {
        id: WALLET,
        name: 'Piggy marbles',
        balance_msat: msat(state.balanceSats),
        in_flight_msat: '0',
        in_flight_count: 0,
        active_pay_links: state.payLink ? 1 : 0,
        open_withdraw_links: 0,
        limits: { day: null, week: null },
        status: 'active',
        created_at: '2026-11-13T00:00:00.000Z',
      })
    case '/transactions': {
      const status = url.searchParams.get('status')
      const [from, to] = ['from', 'to'].map(name => url.searchParams.get(name))
      const [start, end] = [from, to].map(time => (time === null ? null : Date.parse(time)))
      if (Number.isNaN(start) || Number.isNaN(end) || (start !== null && end !== null && start >= end)) return error(res, 400, 'invalid_request')
      const until = end ?? Infinity
      const since = start ?? (end ?? Date.now()) - RANGE_DAYS * DAY_MS
      const made = state.lastTx && Date.parse(state.lastTx.settledAt)
      const txs = state.lastTx && (status === null || status === 'settled') && made >= since && made < until ? [transaction(state.lastTx)] : []
      // The range it read in, in UTC (contract 1.2.0): `from` as given or the default, `to` or null.
      const range = { from: new Date(since).toISOString(), to: end === null ? null : new Date(end).toISOString() }
      return send(res, 200, { transactions: txs, next_cursor: null, range })
    }
    case '/pay-links':
      if (!rightsOf(key).includes('pay_links')) return error(res, 403, 'forbidden')
      return send(res, 200, {
        pay_links: state.payLink
          ? [{
              id: 'Lk3fQ0pBc9dZrWa1LeTxQ0pBc9dZrWa1LeTxQ0pBc9d',
              name: 'Piggy',
              description: 'Piggy bank',
              min_sat: 1,
              max_sat: 1_000_000,
              comment_max: 100,
              success_message: null,
              success_url: null,
              address: state.payLink.address ?? null,
              created_at: '2026-11-13T00:00:00.000Z',
              url: state.payLink.lnurl ? 'https://marbles-mock/lnurlp/Lk3f' : null,
              lnurl: state.payLink.lnurl ?? null,
              lnurlp: state.payLink.lnurl ? 'lnurlp://marbles-mock/lnurlp/Lk3f' : null,
              payments: 0,
              received_msat: '0',
            }]
          : [],
      })
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  if (url.pathname.startsWith('/api/v1/')) return api(req, res, url)

  switch (`${req.method} ${url.pathname}`) {
    case 'GET /health':
      return send(res, 200, { ok: true })

    case 'POST /test/reset':
      state = defaultState()
      return send(res, 200, { ok: true, state })

    case 'POST /test/set': {
      const body = await readJson(req)
      if (body.balance !== undefined) state.balanceSats = Number(body.balance)
      if (body.payLink !== undefined) state.payLink = body.payLink
      if (body.reachable !== undefined) state.reachable = Boolean(body.reachable)
      if (body.retryAfter !== undefined) state.retryAfter = body.retryAfter === null ? null : Number(body.retryAfter)
      if (body.payment !== undefined) recordTx(body.payment)
      return send(res, 200, { ok: true, state })
    }

    case 'POST /test/payment': {
      const body = await readJson(req)
      state.balanceSats += Number(body.sats ?? 0)
      recordTx({ sats: body.sats, comment: body.comment })
      return send(res, 200, { ok: true, state })
    }

    case 'GET /test/requests':
      return send(res, 200, { count: state.requests })

    default:
      return send(res, 404, { error: 'not found' })
  }
})

server.listen(PORT, () => {
  console.log(`marbles-mock listening on :${PORT}`)
})

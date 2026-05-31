// Minimal LNBits mock for E2E tests.
//
// Implements only the endpoints piggybank actually calls (see server/utils/LnBits.ts):
//   GET /api/v1/wallet            -> { balance }              (balance in millisats)
//   GET /lnurlp/api/v1/links      -> [{ username, lnurl }]
//   GET /api/v1/payments?limit=1  -> [{ amount, memo, extra, time }]
//
// Plus a test-only control API (NOT part of the real LNBits API):
//   POST /test/reset              -> restore default state
//   POST /test/set                -> override state fields { balance, lnurl, username, payment }
//   POST /test/payment            -> simulate an incoming payment { sats, comment }
//   GET  /health                  -> liveness probe
//
// State is in-memory. The app talks to this over the Docker network on port 80
// (http://lnbits-mock); the control API is reached from the host on the mapped port.

import { createServer } from 'node:http'

const PORT = Number(process.env.PORT || 80)

const defaultState = () => ({
  // Stored in sats; the LNBits wallet/payment endpoints convert to millisats.
  balanceSats: 100_000,
  username: 'piggy',
  lnurl: 'LNURL1DP68GURN8GHJ7MRWW4EXCTNXD9SHG6NPVCHXXMMD9AKXUATJD3CZ7MOCKLNURLPAY',
  // { amountSats, comment, time } | null
  lastPayment: null,
})

let state = defaultState()

// LNBits returns the payment `time` as a string; the app parses it via
// new Date(value.split('.')[0]). Produce a value that round-trips cleanly.
const lnbitsTime = (date = new Date()) =>
  date.toISOString().replace('T', ' ').replace('Z', '')

const send = (res, status, body) => {
  const payload = body === undefined ? '' : JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(payload)
}

const readJson = req =>
  new Promise((resolve) => {
    let raw = ''
    req.on('data', chunk => (raw += chunk))
    req.on('end', () => {
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        resolve({})
      }
    })
  })

const lnurlpLinks = () =>
  state.lnurl ? [{ username: state.username, lnurl: state.lnurl }] : []

const paymentList = () => {
  if (!state.lastPayment) return []
  const { amountSats, comment, time } = state.lastPayment
  return [
    {
      amount: amountSats * 1000,
      memo: comment,
      extra: { comment },
      time,
    },
  ]
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost')
  const route = `${req.method} ${pathname}`

  switch (route) {
    // --- liveness ---
    case 'GET /health':
      return send(res, 200, { ok: true })

    // --- LNBits API (consumed by piggybank) ---
    case 'GET /api/v1/wallet':
      return send(res, 200, {
        id: 'mock-wallet',
        name: 'Piggy Mock Wallet',
        balance: state.balanceSats * 1000,
      })

    case 'GET /lnurlp/api/v1/links':
      return send(res, 200, lnurlpLinks())

    case 'GET /api/v1/payments':
      return send(res, 200, paymentList())

    // --- Test control API ---
    case 'POST /test/reset':
      state = defaultState()
      return send(res, 200, { ok: true, state })

    case 'POST /test/set': {
      const body = await readJson(req)
      if (body.balance !== undefined) state.balanceSats = Number(body.balance)
      if (body.username !== undefined) state.username = body.username
      if (body.lnurl !== undefined) state.lnurl = body.lnurl
      if (body.payment !== undefined) {
        state.lastPayment = body.payment
          ? {
              amountSats: Number(body.payment.sats ?? 0),
              comment: body.payment.comment ?? null,
              time: lnbitsTime(),
            }
          : null
      }
      return send(res, 200, { ok: true, state })
    }

    case 'POST /test/payment': {
      const body = await readJson(req)
      const sats = Number(body.sats ?? 0)
      const comment = body.comment ?? null
      state.balanceSats += sats
      state.lastPayment = { amountSats: sats, comment, time: lnbitsTime() }
      return send(res, 200, { ok: true, state })
    }

    default:
      return send(res, 404, { error: 'not found', route })
  }
})

server.listen(PORT, () => {
  console.log(`lnbits-mock listening on :${PORT}`)
})

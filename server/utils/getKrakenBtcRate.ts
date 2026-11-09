import { z } from 'zod'

const CACHE_TIME = 60 * 1000 // 1 minute
// Same budget as the LNBits calls: a dead ticker must not freeze the dashboard.
const DEFAULT_TIMEOUT_MS = 3_000

// `c[0]` is the last trade's closing price, see
// https://docs.kraken.com/api/docs/rest-api/get-ticker-information
const TickerResponse = z.object({
  result: z.object({
    XXBTZEUR: z.object({ c: z.tuple([z.string()], z.string()) }),
  }),
})

/**
 * The current BTC/EUR rate from Kraken's public ticker, or null when Kraken
 * cannot be reached or answers with anything but a positive rate.
 */
export const fetchKrakenBtcRate = async (baseUrl: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<number | null> => {
  try {
    const response = await fetch(`${baseUrl}/0/public/Ticker?pair=XXBTZEUR`, {
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) return null
    const parsed = TickerResponse.safeParse(await response.json())
    if (!parsed.success) return null
    const rate = Number.parseFloat(parsed.data.result.XXBTZEUR.c[0])
    return Number.isFinite(rate) && rate > 0 ? rate : null
  } catch {
    return null
  }
}

// A failure is remembered briefly, so a dead ticker costs every polling
// dashboard one timeout per window instead of one per poll.
const FAILURE_CACHE_TIME = 10 * 1000

let cached: { rate: number | null, at: number } | null = null
let inFlight: Promise<number | null> | null = null

/**
 * The BTC/EUR rate, cached for a minute. Null when no current rate is
 * available — an expired rate is never served in its place.
 */
export default async (): Promise<number | null> => {
  const now = Date.now()
  if (cached && now - cached.at < (cached.rate === null ? FAILURE_CACHE_TIME : CACHE_TIME)) {
    return cached.rate
  }

  // Concurrent callers share one fetch.
  // KRAKEN_URL overrides the API base (used to point at the mock in E2E tests).
  inFlight ??= fetchKrakenBtcRate(process.env.KRAKEN_URL || 'https://api.kraken.com')
    .then((rate) => {
      cached = { rate, at: now }
      return rate
    })
    .finally(() => {
      inFlight = null
    })
  return inFlight
}

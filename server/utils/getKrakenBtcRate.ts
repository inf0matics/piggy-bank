let cachedRate: number | null = null
let lastFetchTime: number | null = null
const CACHE_TIME = 60 * 1000 // 1 minute

export default async () => {
  const now = Date.now()

  if (cachedRate !== null && lastFetchTime !== null && (now - lastFetchTime) < CACHE_TIME) {
    return cachedRate
  }

  // KRAKEN_URL overrides the API base (used to point at the mock in E2E tests).
  const baseUrl = process.env.KRAKEN_URL || 'https://api.kraken.com'
  const response = await fetch(`${baseUrl}/0/public/Ticker?pair=XXBTZEUR`)
  const data = await response.json() as { result: { XXBTZEUR: { c: [string] } } }
  cachedRate = Number.parseFloat(data.result.XXBTZEUR.c[0]) // Last Trade closed --> see https://docs.kraken.com/api/docs/rest-api/get-ticker-information
  lastFetchTime = now

  return cachedRate
}

import { z } from 'zod'

const LnUrlPayItem = z.object({
  username: z.string().nullable(),
  lnurl: z.string(),
})

type LnUrlPayItem = z.infer<typeof LnUrlPayItem>

const LnUrlPayResponse = z.array(LnUrlPayItem)

type LnUrlPayResponse = z.infer<typeof LnUrlPayResponse>

const PaymentItem = z.object({
  amount: z.number(),
  memo: z.string().nullable().optional(),
  extra: z.object({
    comment: z.string().optional().nullable(),
  }),
  time: z
    .string()
    .transform((val) => {
      const [datePart = ''] = val.split('.')
      return new Date(datePart).getTime() / 1000
    })
    .describe('Transaction time'),
})

type PaymentItem = z.infer<typeof PaymentItem>

const PaymentResponse = z.array(PaymentItem)

// Long enough for a healthy LNBits, short enough that a page waiting on a dead
// one does not feel frozen. Without it undici waits up to 300 s for a hung host.
const DEFAULT_TIMEOUT_MS = 3_000

/**
 * LNBits could not be reached: network failure, timeout, or a 5xx from LNBits
 * or its proxy. Distinct from LNBits answering with a refusal (e.g. a 4xx for a
 * bad invoice key), which stays a plain Error.
 */
export class LnBitsUnreachableError extends Error {
  constructor(url: string, options?: ErrorOptions) {
    super(`LNBits unreachable: ${url}`, options)
    this.name = 'LnBitsUnreachableError'
  }
}

export default class LnBits {
  apiKey: string
  url: string
  timeoutMs: number

  constructor({ apiKey, url, timeoutMs = DEFAULT_TIMEOUT_MS }: { apiKey: string, url: string, timeoutMs?: number }) {
    this.apiKey = apiKey
    this.url = url
    this.timeoutMs = timeoutMs
  }

  async getBalance() {
    const response = await this.request('/api/v1/wallet')

    if (!response.ok) {
      throw new Error(`Fetch error: ${response.status} ${response.statusText}`)
    }

    const data = JSON.parse(response.text) as { balance: number }
    return data.balance
  }

  async getLnurlPs(): Promise<LnUrlPayResponse | null> {
    const response = await this.request('/lnurlp/api/v1/links')
    if (!response.ok) {
      // If there are no lnurlp or extension installed it return 403
      return null
    }

    return LnUrlPayResponse.parse(JSON.parse(response.text))
  }

  async getLastPayment() {
    const response = await this.request('/api/v1/payments?limit=1')

    if (!response.ok) {
      throw new Error(`Fetch error: ${response.status} ${response.statusText}`)
    }

    const data = PaymentResponse.parse(JSON.parse(response.text))
    const first = data[0]
    if (!first) {
      return null
    }
    const comment = first.extra.comment || first.memo || null
    return {
      amount: first.amount,
      comment,
      time: first.time,
    }
  }

  // The timeout covers the whole exchange, body included, so a stalled body is
  // reported as unreachable too. JSON is parsed by the caller: a malformed
  // answer from a reachable LNBits is not an outage.
  private async request(path: string): Promise<{ ok: boolean, status: number, statusText: string, text: string }> {
    let response: Response
    let text: string
    try {
      response = await fetch(`${this.url}${path}`, {
        headers: { 'X-Api-Key': this.apiKey },
        signal: AbortSignal.timeout(this.timeoutMs),
      })
      text = await response.text()
    } catch (error) {
      throw new LnBitsUnreachableError(this.url, { cause: error })
    }
    if (response.status >= 500) {
      throw new LnBitsUnreachableError(this.url, { cause: new Error(`${response.status} ${response.statusText}`) })
    }
    return { ok: response.ok, status: response.status, statusText: response.statusText, text }
  }
}

import z from 'zod'
import { lnbitsPaymentToChange, type UserSchema } from '~/server/domain/user'
import getKrakenBtcRate from '~/server/utils/getKrakenBtcRate'
import LnBits, { LnBitsUnreachableError } from '~/server/utils/LnBits'

// `available: false` — LNBits cannot be reached right now. Not an error: the
// dashboard says so and keeps polling until LNBits is back.
// `rate` and `eur` are null when no current BTC/EUR rate is available.
export const DashboardDto = z.discriminatedUnion('available', [z.object({
  available: z.literal(true),
  name: z.string(),
  sats: z.number(),
  eur: z.number().nullable(),
  rate: z.number().nullable(),
  lnurl: z.string().nullable(),
  address: z.string().nullable(),
  payment: z.object({
    sats: z.number(),
    comment: z.string().nullable(),
    time: z.number(),
  }).nullable(),
}), z.object({
  available: z.literal(false),
  name: z.string(),
})])
export type DashboardDto = z.infer<typeof DashboardDto>

type DashboardBalance = Pick<Extract<DashboardDto, { available: true }>, 'sats' | 'lnurl' | 'address' | 'payment'>

const available = async (name: string, balance: DashboardBalance) => {
  const rate = await getKrakenBtcRate()
  const eur = rate === null ? null : Math.round(balance.sats / 100_000_000 * rate * 100) / 100
  return DashboardDto.parse({ available: true, name, ...balance, eur, rate })
}

export default defineLoggedInEventHandler(async (event, authUser) => {
  const user = authUser as UserSchema

  // A manual balance needs nothing from LNBits; there is nothing to pay into.
  if (user.balance.source === 'manual') {
    return available(user.name, {
      sats: user.balance.sats,
      lnurl: null,
      address: null,
      payment: user.balance.lastChange,
    })
  }

  const lnbits = new LnBits({
    apiKey: user.lnbits.invoiceKey,
    url: user.lnbits.url,
  })
  const unavailable = () => DashboardDto.parse({ available: false, name: user.name })

  let lnbitsBalance: number
  try {
    lnbitsBalance = await lnbits.getBalance()
  } catch (error) {
    if (error instanceof LnBitsUnreachableError) return unavailable()
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching lnbits balance. Please check invoice key!',
    })
  }

  // The balance answered, so LNBits is up. A failing LNURL-p extension only
  // means no deposit option; an unreachable payments call means LNBits just
  // went away.
  const [links, last] = await Promise.allSettled([lnbits.getLnurlPs(), lnbits.getLastPayment()])
  if (last.status === 'rejected') {
    if (last.reason instanceof LnBitsUnreachableError) return unavailable()
    throw last.reason
  }
  if (links.status === 'rejected' && !(links.reason instanceof LnBitsUnreachableError)) {
    throw links.reason
  }
  const lnurlPs = links.status === 'fulfilled' ? links.value : null
  const lastLnbitsPayment = last.value
  let address: string | null = null
  let lnurl: string | null = null

  if (lnurlPs && lnurlPs.length > 0 && lnurlPs[0]?.lnurl) {
    lnurl = lnurlPs[0].lnurl
  }
  if (lnurlPs && lnurlPs.length > 0 && lnurlPs[0]?.username) {
    address = `${lnurlPs[0].username}@${new URL(user.lnbits.url).hostname}`
  }

  return available(user.name, {
    sats: Math.floor(lnbitsBalance / 1000),
    lnurl,
    address,
    payment: lastLnbitsPayment ? lnbitsPaymentToChange(lastLnbitsPayment) : null,
  })
})

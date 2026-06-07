import { z } from 'zod'
import LnBits from '~/server/utils/LnBits'

const Body = z.object({
  lnbitsUrl: z.string().trim().url(),
  invoiceKey: z.string().trim().min(1),
})

// Probes an LNBits wallet (URL + invoice key) without persisting anything, so
// the admin can verify a piggy bank's connection before saving. Reports whether
// the wallet is reachable and whether an LNURL-p is configured. Always 200; the
// outcome is in the `ok` flag so the form can show it inline.
export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const parsed = Body.safeParse(await readBody(event))
  if (!parsed.success) {
    return { ok: false, error: 'Enter a valid LNBits URL and invoice key.' }
  }

  const lnbits = new LnBits({ apiKey: parsed.data.invoiceKey, url: parsed.data.lnbitsUrl })

  let balanceSats: number
  try {
    balanceSats = Math.floor((await lnbits.getBalance()) / 1000)
  } catch {
    return { ok: false, error: 'Could not connect — check the URL and invoice key.' }
  }

  let lnurlpActive = false
  try {
    const lnurlPs = await lnbits.getLnurlPs()
    lnurlpActive = !!lnurlPs && lnurlPs.length > 0
  } catch {
    lnurlpActive = false
  }

  return { ok: true, balanceSats, lnurlpActive }
})

import LnBits from '~/server/utils/LnBits'

// Lists piggy banks with a live LNURL-p status per record. The status check is
// best-effort: an unreachable LNBits or missing extension just reads "inactive".
export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const users = getUsersByOwner(admin.sub)

  return Promise.all(users.map(async (user) => {
    const lnbits = new LnBits({ apiKey: user.lnbits.invoiceKey, url: user.lnbits.url })

    let lnurlpActive = false
    let lnurl: string | null = null
    let address: string | null = null
    try {
      const lnurlPs = await lnbits.getLnurlPs()
      if (lnurlPs && lnurlPs.length > 0) {
        lnurlpActive = true
        lnurl = lnurlPs[0].lnurl ?? null
        if (lnurlPs[0].username) {
          address = `${lnurlPs[0].username}@${new URL(user.lnbits.url).hostname}`
        }
      }
    } catch {
      lnurlpActive = false
    }

    let lastPaymentTime: number | null = null
    try {
      const last = await lnbits.getLastPayment()
      lastPaymentTime = last?.time ?? null
    } catch {
      lastPaymentTime = null
    }

    return {
      id: user.id,
      name: user.name,
      accessKey: user.accessKey,
      lnbitsUrl: user.lnbits.url,
      lnurlpActive,
      lnurl,
      address,
      lastPaymentTime,
    }
  }))
})

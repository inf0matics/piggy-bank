import LnBits from '~/server/utils/LnBits'

// Lists piggy banks with a live LNURL-p status per record. The status check is
// best-effort: an unreachable LNBits or missing extension just reads "inactive".
export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const users = getAllUsers()

  return Promise.all(users.map(async (user) => {
    let lnurlpActive = false
    try {
      const lnurlPs = await new LnBits({ apiKey: user.lnbits.invoiceKey, url: user.lnbits.url }).getLnurlPs()
      lnurlpActive = !!lnurlPs && lnurlPs.length > 0
    } catch {
      lnurlpActive = false
    }
    return {
      id: user.id,
      name: user.name,
      accessKey: user.accessKey,
      lnbitsUrl: user.lnbits.url,
      lnurlpActive,
    }
  }))
})

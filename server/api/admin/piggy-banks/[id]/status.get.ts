import LnBits, { LnBitsUnreachableError } from '~/server/utils/LnBits'

// Live LNBits state of one piggy bank, for its row in the admin list. Each row
// asks on its own, so a slow or dead LNBits only holds up its own row.
// `unreachable`: LNBits cannot be reached. Otherwise best-effort as before: a
// missing extension or a refused request just reads "inactive" / no payment.
export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const id = getRouterParam(event, 'id') as string
  const user = getOwnedUser(id, admin.sub)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
  }

  const lnbits = new LnBits({ apiKey: user.lnbits.invoiceKey, url: user.lnbits.url })
  const [links, last] = await Promise.allSettled([lnbits.getLnurlPs(), lnbits.getLastPayment()])

  if ([links, last].some(r => r.status === 'rejected' && r.reason instanceof LnBitsUnreachableError)) {
    return { lnurlp: 'unreachable' as const, lnurl: null, address: null, lastPaymentTime: null }
  }

  const link = links.status === 'fulfilled' ? links.value?.[0] : undefined
  return {
    lnurlp: link ? 'active' as const : 'inactive' as const,
    lnurl: link?.lnurl ?? null,
    address: link?.username ? `${link.username}@${new URL(user.lnbits.url).hostname}` : null,
    lastPaymentTime: last.status === 'fulfilled' ? (last.value?.time ?? null) : null,
  }
})

import LnBits from '~/server/utils/LnBits'

// The piggy bank's current LNBits wallet balance, shown to the custodian before
// he switches it to the manual source. `sats: null` when LNBits cannot give it
// (unreachable or refusing the key) — he then enters the starting balance.
export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const id = getRouterParam(event, 'id') as string
  const user = getOwnedUser(id, admin.sub)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
  }

  const lnbits = new LnBits({ apiKey: user.lnbits.invoiceKey, url: user.lnbits.url })
  try {
    return { sats: Math.floor((await lnbits.getBalance()) / 1000) }
  } catch {
    return { sats: null }
  }
})

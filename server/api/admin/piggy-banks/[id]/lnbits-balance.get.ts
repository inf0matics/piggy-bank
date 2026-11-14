// The piggy bank's current LNBits wallet balance, shown to the custodian before
// they switch it to the manual source (they then enter the starting balance
// when LNBits cannot give it) or back to LNBits (refused then). `sats: null`
// with the `reason` when LNBits is unreachable or refuses the key.
export default defineEventHandler((event) => {
  const admin = requireAdmin(event)

  const id = getRouterParam(event, 'id') as string
  const user = getOwnedUser(id, admin.sub)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
  }

  return readSourceWalletSats(user, 'lnbits')
})

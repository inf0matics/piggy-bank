// The piggy bank's current marbles wallet balance, read fresh, shown to the
// custodian before they switch it from marbles to manual or from manual to
// marbles. `sats: null` with the `reason` when marbles is unreachable, refuses
// the key or wallet (or no marbles settings are saved), or the key expired.
export default defineEventHandler((event) => {
  const admin = requireAdmin(event)

  const id = getRouterParam(event, 'id') as string
  const user = getOwnedUser(id, admin.sub)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
  }

  return readSourceWalletSats(user, 'marbles')
})

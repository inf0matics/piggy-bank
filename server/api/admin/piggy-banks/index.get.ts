// Lists the admin's piggy banks straight from the DB, so the list renders even
// when LNBits or marbles is down. Each LNBits or marbles row then loads its
// wallet state from /api/admin/piggy-banks/:id/status; a manual row needs
// nothing from a wallet.
export default defineEventHandler((event) => {
  const admin = requireAdmin(event)

  return getUsersByOwner(admin.sub).map(user => ({
    id: user.id,
    name: user.name,
    accessKey: user.accessKey,
    lnbitsUrl: user.lnbits.url,
    marblesUrl: user.marbles?.url ?? null,
    balance: user.balance,
  }))
})

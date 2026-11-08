// Lists the admin's piggy banks straight from the DB, so the list renders even
// when LNBits is down. Each row then loads its LNBits state from
// /api/admin/piggy-banks/:id/status.
export default defineEventHandler((event) => {
  const admin = requireAdmin(event)

  return getUsersByOwner(admin.sub).map(user => ({
    id: user.id,
    name: user.name,
    accessKey: user.accessKey,
    lnbitsUrl: user.lnbits.url,
  }))
})

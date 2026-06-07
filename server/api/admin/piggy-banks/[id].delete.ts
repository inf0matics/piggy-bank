export default defineEventHandler((event) => {
  const admin = requireAdmin(event)

  const id = getRouterParam(event, 'id') as string
  if (!deleteOwnedUser(id, admin.sub)) {
    throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
  }
  return { ok: true }
})

export default defineEventHandler((event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id') as string
  if (!deleteUser(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
  }
  return { ok: true }
})

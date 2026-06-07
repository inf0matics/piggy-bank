export default defineEventHandler((event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id') as string
  const user = getUserById(id)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
  }

  return {
    id: user.id,
    name: user.name,
    accessKey: user.accessKey,
    lnbitsUrl: user.lnbits.url,
    invoiceKey: user.lnbits.invoiceKey,
  }
})

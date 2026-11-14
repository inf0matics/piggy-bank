import { UserInputSchema } from '~/server/domain/user'

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const id = getRouterParam(event, 'id') as string
  const parsed = UserInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Invalid input' })
  }

  // A piggy bank read from marbles keeps its marbles settings; switch it to
  // manual first.
  const marblesNeeded = () => createError({ statusCode: 409, statusMessage: 'The balance is read from marbles, so the marbles settings are needed. Switch to manual first to remove them.' })
  const current = getOwnedUser(id, admin.sub)
  if (!current) {
    throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
  }
  if (current.balance.source === 'marbles' && !parsed.data.marbles) throw marblesNeeded()

  let updated
  try {
    updated = updateOwnedUser(id, admin.sub, parsed.data)
  } catch (error) {
    if (String((error as Error)?.message).includes('UNIQUE')) {
      throw createError({ statusCode: 409, statusMessage: 'PIN is already in use' })
    }
    throw error
  }

  if (!updated) {
    // Deleted, or switched to marbles by a concurrent request.
    if (getOwnedUser(id, admin.sub)) throw marblesNeeded()
    throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
  }
  return updated
})

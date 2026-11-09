import { ManualSwitchInputSchema } from '~/server/domain/user'

// Switches an LNBits piggy bank to the manual source, frozen at the starting
// balance the custodian confirmed (the LNBits balance he was shown, or one he
// entered while LNBits was unreachable).
export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const id = getRouterParam(event, 'id') as string
  const parsed = ManualSwitchInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Invalid input' })
  }

  const updated = switchOwnedUserToManual(id, admin.sub, parsed.data.sats)
  if (updated) return updated

  // Nothing changed: either not the admin's piggy bank, or already manual.
  if (!getOwnedUser(id, admin.sub)) {
    throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
  }
  throw createError({ statusCode: 409, statusMessage: 'Piggy bank already has a manual balance' })
})

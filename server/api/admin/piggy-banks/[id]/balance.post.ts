import { ManualBalanceChangeInputSchema } from '~/server/domain/user'
import { applyManualChange } from '~/utils/manualBalanceChange'

// Changes a manual piggy bank's balance: sets it, or adds to / subtracts from
// it, in sats the admin view converted from the euros the custodian typed. The
// change becomes the last change, which the dashboard shows as "Last payment".
export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const id = getRouterParam(event, 'id') as string
  const parsed = ManualBalanceChangeInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Invalid input' })
  }

  const user = getOwnedUser(id, admin.sub)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
  }
  if (user.balance.source !== 'manual') {
    throw createError({ statusCode: 409, statusMessage: 'Piggy bank does not have a manual balance' })
  }

  const { comment, ...change } = parsed.data
  const result = applyManualChange(user.balance.sats, change)
  if ('error' in result) {
    throw createError({ statusCode: 400, statusMessage: result.error })
  }

  // No await since the read above, so nothing can have changed the balance.
  return changeOwnedManualBalance(id, admin.sub, result.sats, {
    time: Math.floor(Date.now() / 1000),
    sats: result.delta,
    comment,
  })
})

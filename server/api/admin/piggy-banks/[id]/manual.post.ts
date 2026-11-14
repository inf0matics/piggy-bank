import { lnbitsPaymentToChange, ManualSwitchInputSchema, type BalanceChange, type UserSchema } from '~/server/domain/user'
import LnBits from '~/server/utils/LnBits'
import { readBalance } from '~/server/utils/Marbles'
import type { WalletSource } from '~/utils/switchBack'

// Switches a piggy bank read from LNBits or marbles to the manual source,
// frozen at the starting balance the custodian confirmed (the wallet balance
// they were shown, or one they entered while the wallet could not give it).
export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const id = getRouterParam(event, 'id') as string
  const parsed = ManualSwitchInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Invalid input' })
  }

  const user = getOwnedUser(id, admin.sub)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
  }
  if (user.balance.source === 'manual') {
    throw createError({ statusCode: 409, statusMessage: 'Piggy bank already has a manual balance' })
  }

  const from = user.balance.source
  const { sats } = parsed.data
  const updated = switchOwnedUserToManual(id, admin.sub, from, sats, await freezeLastChange(user, from, sats))
  if (!updated) {
    // Deleted or switched by a concurrent request while the wallet was being asked.
    throw getOwnedUser(id, admin.sub)
      ? createError({ statusCode: 409, statusMessage: 'Piggy bank already has a manual balance' })
      : createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
  }
  return updated
})

// The last change the frozen piggy bank starts with. While the wallet answers,
// its last payment carries over, so the child's dashboard shows no trace of
// the freeze (none when the wallet has no payments). Otherwise the freeze
// itself is the first change.
const freezeLastChange = async (user: UserSchema, from: WalletSource, sats: number): Promise<BalanceChange | null> => {
  const freeze = { time: Math.floor(Date.now() / 1000), sats, comment: null }
  try {
    if (from === 'marbles') {
      return user.marbles ? (await readBalance(user.marbles, { fresh: true })).lastPayment : freeze
    }
    const last = await new LnBits({ apiKey: user.lnbits.invoiceKey, url: user.lnbits.url }).getLastPayment()
    return last ? lnbitsPaymentToChange(last) : null
  } catch {
    return freeze
  }
}

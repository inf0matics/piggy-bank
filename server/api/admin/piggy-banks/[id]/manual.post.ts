import { lnbitsPaymentToChange, ManualSwitchInputSchema, type BalanceChange } from '~/server/domain/user'
import LnBits from '~/server/utils/LnBits'

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

  const user = getOwnedUser(id, admin.sub)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
  }
  if (user.balance.source === 'manual') {
    throw createError({ statusCode: 409, statusMessage: 'Piggy bank already has a manual balance' })
  }

  const { sats } = parsed.data
  const updated = switchOwnedUserToManual(id, admin.sub, sats, await freezeLastChange(user.lnbits, sats))
  if (!updated) {
    // Switched by a concurrent request while LNBits was being asked.
    throw createError({ statusCode: 409, statusMessage: 'Piggy bank already has a manual balance' })
  }
  return updated
})

// The last change the frozen piggy bank starts with. While LNBits answers, its
// last payment carries over, so the child's dashboard shows no trace of the
// freeze (none when the wallet has no payments). Otherwise the freeze itself is
// the first change.
const freezeLastChange = async (lnbits: { url: string, invoiceKey: string }, sats: number): Promise<BalanceChange | null> => {
  try {
    const last = await new LnBits({ apiKey: lnbits.invoiceKey, url: lnbits.url }).getLastPayment()
    return last ? lnbitsPaymentToChange(last) : null
  } catch {
    return { time: Math.floor(Date.now() / 1000), sats, comment: null }
  }
}

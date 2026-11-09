import { SwitchBackInputSchema } from '~/server/domain/user'
import { readWalletSats } from '~/server/utils/LnBits'
import { checkSwitchBack } from '~/utils/switchBack'

// Puts a manual piggy bank back on LNBits (stored URL and key), once the
// custodian compared the manual balance with the wallet's and confirmed. LNBits
// is the balance from then on; the app moves no money. Refused while LNBits
// cannot give its balance, or when either balance moved since he compared them.
export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const id = getRouterParam(event, 'id') as string
  const parsed = SwitchBackInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Invalid input' })
  }

  const user = getOwnedUser(id, admin.sub)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
  }
  if (user.balance.source !== 'manual') {
    throw createError({ statusCode: 409, statusMessage: 'Piggy bank is already on LNBits' })
  }

  const refused = checkSwitchBack({ manualSats: user.balance.sats, wallet: await readWalletSats(user.lnbits) }, parsed.data)
  if (refused) {
    throw createError({ statusCode: refused.statusCode, statusMessage: refused.message })
  }

  const updated = switchOwnedUserToLnbits(id, admin.sub, parsed.data.manualSats)
  if (!updated) {
    // Deleted, switched or changed by a concurrent request while LNBits was being asked.
    const current = getOwnedUser(id, admin.sub)
    if (!current) throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
    throw current.balance.source === 'manual'
      ? createError({ statusCode: 409, statusMessage: 'The manual balance has changed. Compare the balances again.' })
      : createError({ statusCode: 409, statusMessage: 'Piggy bank is already on LNBits' })
  }
  return updated
})

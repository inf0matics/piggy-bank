import type { H3Event } from 'h3'
import { MarblesSwitchInputSchema, SwitchBackInputSchema, type UserSchema } from '../domain/user'
import { readWalletSats } from './LnBits'
import { readMarblesWalletSats } from './Marbles'
import { checkSwitchBack, SOURCE_NAMES, type WalletRead, type WalletSource } from '../../utils/switchBack'

/** The balance of the piggy bank's `source` wallet, read fresh; refused without marbles settings. */
export const readSourceWalletSats = async (user: UserSchema, source: WalletSource): Promise<WalletRead> => {
  if (source === 'lnbits') return readWalletSats(user.lnbits)
  return user.marbles ? readMarblesWalletSats(user.marbles) : { sats: null, reason: 'refused' }
}

// The balances the custodian compared, from either switch's body.
const ComparedInput = {
  lnbits: SwitchBackInputSchema.transform(({ manualSats, lnbitsSats }) => ({ manualSats, walletSats: lnbitsSats })),
  marbles: MarblesSwitchInputSchema.transform(({ manualSats, marblesSats }) => ({ manualSats, walletSats: marblesSats })),
}

/**
 * Puts a manual piggy bank on the wallet `to` (its stored settings), once the
 * custodian compared the manual balance with the wallet's and confirmed (specs
 * admin-12, admin-13). The wallet is the balance from then on; the app moves
 * no money. Refused while the wallet cannot give its balance, or when either
 * balance moved since the custodian compared them. Switching between LNBits
 * and marbles always goes through manual.
 */
export const switchToWallet = async (event: H3Event, to: WalletSource): Promise<UserSchema> => {
  const admin = requireAdmin(event)

  const id = getRouterParam(event, 'id') as string
  const parsed = ComparedInput[to].safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Invalid input' })
  }

  const notManual = (source: WalletSource) => createError({
    statusCode: 409,
    statusMessage: source === to
      ? `Piggy bank is already on ${SOURCE_NAMES[to]}`
      : `Piggy bank is on ${SOURCE_NAMES[source]}. Switch it to manual first.`,
  })
  const noMarbles = () => createError({ statusCode: 409, statusMessage: 'Save the marbles settings first.' })

  const user = getOwnedUser(id, admin.sub)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
  }
  if (user.balance.source !== 'manual') throw notManual(user.balance.source)
  if (to === 'marbles' && !user.marbles) throw noMarbles()

  const refused = checkSwitchBack(to, { manualSats: user.balance.sats, wallet: await readSourceWalletSats(user, to) }, parsed.data)
  if (refused) {
    throw createError({ statusCode: refused.statusCode, statusMessage: refused.message })
  }

  const updated = switchOwnedUserToWallet(id, admin.sub, to, parsed.data.manualSats)
  if (!updated) {
    // Deleted, switched, changed or its marbles settings removed by a
    // concurrent request while the wallet was being asked.
    const current = getOwnedUser(id, admin.sub)
    if (!current) throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
    if (current.balance.source !== 'manual') throw notManual(current.balance.source)
    if (to === 'marbles' && !current.marbles) throw noMarbles()
    throw createError({ statusCode: 409, statusMessage: 'The manual balance has changed. Compare the balances again.' })
  }
  return updated
}

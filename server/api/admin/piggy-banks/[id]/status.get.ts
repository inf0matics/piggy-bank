import type { UserSchema } from '~/server/domain/user'
import LnBits, { LnBitsUnreachableError } from '~/server/utils/LnBits'
import { isUnreachable, readDeposit, readLastPayment, type MarblesConnection } from '~/server/utils/Marbles'

type WalletStatus = {
  lnurlp: 'active' | 'inactive' | 'unreachable'
  lnurl: string | null
  address: string | null
  lastPaymentTime: number | null
}

const UNREACHABLE: WalletStatus = { lnurlp: 'unreachable', lnurl: null, address: null, lastPaymentTime: null }

// Live wallet state of one piggy bank, for its row in the admin list. Each row
// asks on its own, so a slow or dead wallet only holds up its own row.
// `unreachable`: the wallet cannot be reached. Otherwise best-effort as before:
// a missing deposit option or a refused request just reads "inactive" / no
// payment.
export default defineEventHandler(async (event): Promise<WalletStatus> => {
  const admin = requireAdmin(event)

  const id = getRouterParam(event, 'id') as string
  const user = getOwnedUser(id, admin.sub)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
  }

  if (user.balance.source === 'marbles' && user.marbles) return marblesStatus(user.marbles)
  return lnbitsStatus(user)
})

const lnbitsStatus = async (user: UserSchema): Promise<WalletStatus> => {
  const lnbits = new LnBits({ apiKey: user.lnbits.invoiceKey, url: user.lnbits.url })
  const [links, last] = await Promise.allSettled([lnbits.getLnurlPs(), lnbits.getLastPayment()])

  // Reachability is decided by the wallet's payments call: a failing LNURL-p
  // extension on a working LNBits just reads "inactive".
  if (last.status === 'rejected' && last.reason instanceof LnBitsUnreachableError) return UNREACHABLE

  const link = links.status === 'fulfilled' ? links.value?.[0] : undefined
  return {
    lnurlp: link ? 'active' : 'inactive',
    lnurl: link?.lnurl ?? null,
    address: link?.username ? `${link.username}@${new URL(user.lnbits.url).hostname}` : null,
    lastPaymentTime: last.status === 'fulfilled' ? (last.value?.time ?? null) : null,
  }
}

// The cached marbles reads the dashboard uses too, so the list costs no extra
// requests against the key's rate limit while the child's dashboard is open.
const marblesStatus = async (marbles: MarblesConnection): Promise<WalletStatus> => {
  const [deposit, last] = await Promise.allSettled([readDeposit(marbles), readLastPayment(marbles)])

  if (last.status === 'rejected' && isUnreachable(last.reason)) return UNREACHABLE

  const link = deposit.status === 'fulfilled' ? deposit.value : null
  return {
    lnurlp: link ? 'active' : 'inactive',
    lnurl: link?.lnurl ?? null,
    address: link?.address ?? null,
    lastPaymentTime: last.status === 'fulfilled' ? (last.value?.time ?? null) : null,
  }
}

// Switching a manual piggy bank back to LNBits (spec admin-12). The custodian
// compares the manual balance with the wallet's and confirms; LNBits is the
// balance from then on. The app moves no money. Shared by the admin view and
// the API, so both say the same thing.

/** Why LNBits could not give the wallet balance. */
export type WalletUnreadable = 'unreachable' | 'refused'

/** The wallet balance in sats, or why LNBits could not give it. */
export type WalletRead = { sats: number } | { sats: null, reason: WalletUnreadable }

export const WALLET_UNREADABLE: Record<WalletUnreadable, string> = {
  unreachable: 'LNBits cannot be reached, so the piggy bank stays manual. Try again later.',
  refused: 'LNBits refused the invoice key, so the piggy bank stays manual. Check the LNBits URL and invoice key.',
}

/** The two balances the custodian compared before confirming. */
export interface ComparedBalances {
  manualSats: number
  lnbitsSats: number
}

/**
 * Why the switch back is refused, or null when it may go ahead: LNBits must
 * give its balance, and both balances must still be the ones the custodian
 * compared.
 */
export const checkSwitchBack = (
  current: { manualSats: number, wallet: WalletRead },
  compared: ComparedBalances,
): { statusCode: number, message: string } | null => {
  const { wallet } = current
  if (wallet.sats === null) {
    return { statusCode: wallet.reason === 'unreachable' ? 503 : 502, message: WALLET_UNREADABLE[wallet.reason] }
  }
  if (wallet.sats !== compared.lnbitsSats) {
    return { statusCode: 409, message: `The LNBits balance is now ${wallet.sats.toLocaleString('en-US')} sats. Compare the balances again.` }
  }
  if (current.manualSats !== compared.manualSats) {
    return { statusCode: 409, message: 'The manual balance has changed. Compare the balances again.' }
  }
  return null
}

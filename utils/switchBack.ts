// Switching a manual piggy bank to a wallet: back to LNBits (spec admin-12) or
// to marbles (spec admin-13). The custodian compares the manual balance with
// the wallet's and confirms; the wallet is the balance from then on. The app
// moves no money. Shared by the admin view and the API, so both say the same
// thing.

/** A balance source that is read from a wallet. */
export type WalletSource = 'lnbits' | 'marbles'

export const SOURCE_NAMES: Record<WalletSource, string> = {
  lnbits: 'LNBits',
  marbles: 'marbles',
}

/** Why the wallet could not give its balance. Only marbles keys expire. */
export type WalletUnreadable = 'unreachable' | 'refused' | 'expired'

/** The wallet balance in sats, or why it could not be read. */
export type WalletRead = { sats: number } | { sats: null, reason: WalletUnreadable }

const LNBITS_REFUSED = 'LNBits refused the invoice key, so the piggy bank stays manual. Check the LNBits URL and invoice key.'

export const WALLET_UNREADABLE: Record<WalletSource, Record<WalletUnreadable, string>> = {
  lnbits: {
    unreachable: 'LNBits cannot be reached, so the piggy bank stays manual. Try again later.',
    refused: LNBITS_REFUSED,
    expired: LNBITS_REFUSED,
  },
  marbles: {
    unreachable: 'marbles cannot be reached, so the piggy bank stays manual. Try again later.',
    refused: 'marbles refused the API key or the wallet, so the piggy bank stays manual. Check the marbles settings.',
    expired: 'The marbles API key has expired, so the piggy bank stays manual. Make a new key in marbles and save it below.',
  },
}

/** The two balances the custodian compared before confirming. */
export interface ComparedBalances {
  manualSats: number
  walletSats: number
}

/**
 * Why the switch to the wallet is refused, or null when it may go ahead: the
 * wallet must give its balance, and both balances must still be the ones the
 * custodian compared.
 */
export const checkSwitchBack = (
  source: WalletSource,
  current: { manualSats: number, wallet: WalletRead },
  compared: ComparedBalances,
): { statusCode: number, message: string } | null => {
  const { wallet } = current
  if (wallet.sats === null) {
    return { statusCode: wallet.reason === 'unreachable' ? 503 : 502, message: WALLET_UNREADABLE[source][wallet.reason] }
  }
  if (wallet.sats !== compared.walletSats) {
    return { statusCode: 409, message: `The ${SOURCE_NAMES[source]} balance is now ${wallet.sats.toLocaleString('en-US')} sats. Compare the balances again.` }
  }
  if (current.manualSats !== compared.manualSats) {
    return { statusCode: 409, message: 'The manual balance has changed. Compare the balances again.' }
  }
  return null
}

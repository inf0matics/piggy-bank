import { MarblesSettingsSchema } from '~/server/domain/user'
import { checkKeyFor, MarblesError, readBalance, readDeposit, readKey, type MarblesFailure } from '~/server/utils/Marbles'

const FAILURES: Record<MarblesFailure, string> = {
  unreachable: 'marbles cannot be reached. Check the URL, or try again in a minute.',
  refused: 'marbles refused the API key or the wallet. Check the key and the wallet id.',
  expired: 'The marbles API key has expired. Make a new key in marbles.',
  forbidden: 'marbles refused the API key: it lacks a right. The piggy bank needs read and pay_links.',
  malformed: 'marbles gave an answer the app cannot read. Check the URL.',
}

// Probes a piggy bank's marbles settings (URL, API key, wallet) without saving
// anything (spec admin-13): the key must reach the wallet with the rights
// `read` and `pay_links`. Reports the wallet's name and balance, whether an
// active pay link exists, when the key expires, and the rights it has that can
// move money out of the wallet. Always 200; the outcome is in `ok`.
export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const parsed = MarblesSettingsSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Enter the marbles URL, API key and wallet id.' }
  }
  const marbles = parsed.data

  try {
    const key = await readKey(marbles)
    const checked = checkKeyFor(key, marbles.wallet)
    if (!checked.ok) return checked

    const [wallet, deposit] = await Promise.all([readBalance(marbles, { fresh: true }), readDeposit(marbles, { fresh: true })])
    return {
      ok: true,
      walletName: checked.walletName,
      balanceSats: wallet.sats,
      payLinkActive: deposit !== null,
      expiresAt: key.expiresAt,
      riskyRights: checked.riskyRights,
    }
  } catch (error) {
    return { ok: false, error: FAILURES[error instanceof MarblesError ? error.reason : 'malformed'] }
  }
})

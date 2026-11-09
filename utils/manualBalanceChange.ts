// Changing a manual balance (spec admin-11). The custodian types euros; the
// balance is held in sats. Shared by the admin view (preview) and the API
// (the change itself), so both apply the same rules.

/** The 21M BTC supply in sats: no balance can be larger. */
export const MAX_SATS = 2_100_000_000_000_000

/** The longest comment a change can carry. */
export const MAX_COMMENT_LENGTH = 200

export type ChangeMode = 'set' | 'add'

/** A change the custodian typed: `set` the balance, or `add` (negative: subtract). */
export interface EurChange {
  mode: ChangeMode
  eur: number
}

/** The same change in sats, as the API takes it. */
export interface ManualChange {
  mode: ChangeMode
  sats: number
}

// `25` sets, `+10` adds, `-10` (hyphen or minus sign) subtracts. Up to two
// decimals with a point or a comma; nothing else, so `1,000` is refused rather
// than read as one euro.
const EUR_CHANGE = /^([+\-−]?)\s*(\d+(?:[.,]\d{1,2})?)$/

/** Reads what the custodian typed, or null when it is not a valid amount. */
export const parseEurChange = (input: string): EurChange | null => {
  const match = EUR_CHANGE.exec(input.trim())
  if (!match) return null
  const [, sign, amount] = match as unknown as [string, string, string]
  const eur = Number(amount.replace(',', '.'))
  if (!sign) return { mode: 'set', eur }
  return { mode: 'add', eur: sign === '+' ? eur : -eur }
}

/** Euros as whole sats at `rate` (EUR per BTC). */
const eurToSats = (eur: number, rate: number): number => Math.round(eur / rate * 100_000_000)

/** Sats as euros at `rate`, rounded to cents. */
export const satsToEur = (sats: number, rate: number): number => Math.round(sats / 100_000_000 * rate * 100) / 100

/** Converts a change at `rate`. Rounds the amount, not the sign, so +10 and -10 cancel out. */
export const eurChangeToSats = (change: EurChange, rate: number): ManualChange => ({
  mode: change.mode,
  sats: Math.sign(change.eur) * eurToSats(Math.abs(change.eur), rate),
})

/**
 * The balance after `change`, with the difference to `balance` (both sats), or
 * why the change is refused.
 */
export const applyManualChange = (balance: number, change: ManualChange): { sats: number, delta: number } | { error: string } => {
  const sats = change.mode === 'set' ? change.sats : balance + change.sats
  if (sats < 0) return { error: 'The balance cannot go below zero' }
  if (sats > MAX_SATS) return { error: 'The balance cannot exceed 21 million BTC' }
  if (sats === balance) return { error: 'Nothing to change' }
  return { sats, delta: sats - balance }
}

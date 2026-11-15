import { z } from 'zod'

// Keys for the `settings` key/value table.

/**
 * Default LNBits URL used to pre-fill the "Add piggy bank" form. Scoped per
 * custodian: the stored key is `default_lnbits_url:<logto-sub>`.
 */
export const DEFAULT_LNBITS_URL_KEY = 'default_lnbits_url'

/**
 * Default marbles URL used to pre-fill a piggy bank's empty marbles URL field.
 * Scoped per custodian like the LNBits one.
 */
export const DEFAULT_MARBLES_URL_KEY = 'default_marbles_url'

const defaultUrl = (error: string) => z.string({ error }).trim().max(2048, { error }).refine(
  value => value === '' || isHttpUrl(value),
  { error },
).default('')

const isHttpUrl = (value: string): boolean => {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/** PUT /api/admin/settings: each default is empty (none) or an http(s) URL. */
export const SettingsInputSchema = z.strictObject({
  defaultLnbitsUrl: defaultUrl('The default LNBits URL must be an http(s) URL'),
  defaultMarblesUrl: defaultUrl('The default marbles URL must be an http(s) URL'),
})

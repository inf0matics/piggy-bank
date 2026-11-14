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

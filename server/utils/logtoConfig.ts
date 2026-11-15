// The `cookieEncryptionKey` fallback in nuxt.config.ts: @logto/node's cookie
// storage needs a non-empty key even with admin auth off. It is public, so the
// app refuses to start with it while Logto is on (logtoConfigState).
export const FALLBACK_COOKIE_KEY = 'insecure-fallback-set-NUXT_LOGTO_COOKIE_ENCRYPTION_KEY'

/**
 * The admin (Logto) auth configuration. The app starts only when it is
 * `disabled` or `configured`:
 * - `no-key`: the cookie key is set but empty. An empty env var replaces the
 *   fallback, and @logto/node then throws on every request, Logto on or off.
 * - `disabled`: no endpoint; admin login is off, the rest of the app works.
 * - `insecure`: an endpoint, but the cookie key is the public fallback. Anyone
 *   could forge an admin session with it.
 * - `configured`: an endpoint and a key of its own.
 */
export const logtoConfigState = ({ endpoint, cookieEncryptionKey }: { endpoint: string, cookieEncryptionKey: string }): 'no-key' | 'disabled' | 'insecure' | 'configured' => {
  if (!cookieEncryptionKey.trim()) return 'no-key'
  if (!endpoint) return 'disabled'
  if (cookieEncryptionKey === FALLBACK_COOKIE_KEY) return 'insecure'
  return 'configured'
}

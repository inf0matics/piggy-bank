import consola from 'consola'

// Keep in sync with the `cookieEncryptionKey` fallback in nuxt.config.ts.
const FALLBACK_COOKIE_KEY = 'insecure-fallback-set-NUXT_LOGTO_COOKIE_ENCRYPTION_KEY'

// Surfaces the state of the admin (Logto) auth configuration at startup. The
// app intentionally stays up even when Logto is unconfigured (admin login is
// just disabled), so make the operator aware of what's going on.
export default defineNitroPlugin(() => {
  const { logto } = useRuntimeConfig()

  if (!logto?.endpoint) {
    consola.warn('[logto] Admin auth is not configured (NUXT_LOGTO_ENDPOINT is empty). The /admin landing page works, but "Login as admin" is disabled. Set NUXT_LOGTO_* to enable it.')
    return
  }

  if (logto.cookieEncryptionKey === FALLBACK_COOKIE_KEY) {
    consola.error('[logto] NUXT_LOGTO_COOKIE_ENCRYPTION_KEY is not set while Logto is enabled — the admin session cookie is using an INSECURE built-in key. Set NUXT_LOGTO_COOKIE_ENCRYPTION_KEY to a random secret.')
    return
  }

  consola.info('[logto] Admin auth configured')
})

import { consola } from 'consola'
import { logtoConfigState } from '../utils/logtoConfig'

// Checks the admin (Logto) auth configuration at startup. Without an endpoint
// the app stays up with admin login disabled. With an endpoint but no cookie
// encryption key of its own it refuses to start: the built-in fallback key is
// public, so anyone could forge an admin session.
export default defineNitroPlugin(() => {
  const { logto } = useRuntimeConfig()

  switch (logtoConfigState({ endpoint: logto?.endpoint ?? '', cookieEncryptionKey: logto?.cookieEncryptionKey ?? '' })) {
    case 'disabled':
      consola.warn('[logto] Admin auth is not configured (NUXT_LOGTO_ENDPOINT is empty). The /admin landing page works, but "Login as admin" is disabled. Set NUXT_LOGTO_* to enable it.')
      return
    case 'insecure':
      consola.error('[logto] NUXT_LOGTO_COOKIE_ENCRYPTION_KEY is not set while Logto is enabled. Refusing to start: the built-in key is public. Set it to a random secret.')
      throw new Error('NUXT_LOGTO_COOKIE_ENCRYPTION_KEY is not set while Logto is enabled')
    case 'configured':
      consola.info('[logto] Admin auth configured')
  }
})

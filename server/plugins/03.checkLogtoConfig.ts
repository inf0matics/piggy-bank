import { consola } from 'consola'
import { logtoConfigState } from '../utils/logtoConfig'

// Checks the admin (Logto) auth configuration at startup. Without an endpoint
// the app stays up with admin login disabled. It refuses to start with an
// empty cookie key (every request would fail), or with Logto on and the public
// built-in key (anyone could forge an admin session).
export default defineNitroPlugin(() => {
  const { logto } = useRuntimeConfig()

  switch (logtoConfigState({ endpoint: logto?.endpoint ?? '', cookieEncryptionKey: logto?.cookieEncryptionKey ?? '' })) {
    case 'no-key':
      consola.error('[logto] NUXT_LOGTO_COOKIE_ENCRYPTION_KEY is set but empty, so every request would fail. Refusing to start: set it to a random secret, or remove it while Logto is off.')
      throw new Error('NUXT_LOGTO_COOKIE_ENCRYPTION_KEY is empty')
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

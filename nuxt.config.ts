// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@thespielplatz/nuxt-auth',
    '@thespielplatz/nuxt-dev-base',
    '@logto/nuxt',
  ],
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Piggy Bank',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
      ],
    },
  },
  css: [
    '@/assets/css/global.css',
    '@/assets/css/main.css',
  ],
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'info', 'success', 'warning', 'error', 'footer'],
    },
  },
  runtimeConfig: {
    // Logto admin authentication. Secrets are supplied via NUXT_LOGTO_* env
    // vars (see .env.example), which override these placeholders.
    //
    // When `endpoint` is empty, admin login is effectively disabled: the global
    // Logto handler still runs on every request but only resolves the user as
    // logged-out (no network call), so the core piggy-bank app keeps working.
    //
    // `cookieEncryptionKey` MUST be non-empty or @logto/node's CookieStorage
    // throws on every request and takes down the whole site. The fallback below
    // keeps the app up when admin auth is unconfigured; production deployments
    // that enable Logto MUST override it via NUXT_LOGTO_COOKIE_ENCRYPTION_KEY.
    logto: {
      endpoint: '',
      appId: '',
      appSecret: '',
      cookieEncryptionKey: 'insecure-fallback-set-NUXT_LOGTO_COOKIE_ENCRYPTION_KEY',
      // Request profile/email so the ID token carries name/username/email for the
      // admin identity display (the `sub` claim, used for ownership, is always present).
      scopes: ['profile', 'email'],
      postCallbackRedirectUri: '/admin/piggy-banks',
      postLogoutRedirectUri: '/admin',
      pathnames: {
        signIn: '/admin/sign-in',
        signOut: '/admin/sign-out',
        callback: '/admin/callback',
      },
    },
    public: {
      // Admin auth mode. Empty = real Logto auth (production default). Set to
      // 'e2e' via NUXT_PUBLIC_ADMIN_AUTH_MODE only in the e2e stack: an `e2e_admin`
      // cookie then counts as an authenticated admin so the CRUD tests can run
      // without a real Logto tenant. Never enable this in production.
      adminAuthMode: '',
    },
  },
  experimental: {
    appManifest: false,
  },
  compatibilityDate: '2024-11-01',
  fonts: {
    families: [
      { name: 'Fredoka', provider: 'google' },
      { name: 'Tektur', provider: 'google' },
    ],
    experimental: {
      processCSSVariables: true,
    },
  },
})

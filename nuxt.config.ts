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
    // vars (see .env.example), which override these empty placeholders.
    logto: {
      endpoint: '',
      appId: '',
      appSecret: '',
      cookieEncryptionKey: '',
      postCallbackRedirectUri: '/admin/piggy-banks',
      postLogoutRedirectUri: '/admin',
      pathnames: {
        signIn: '/admin/sign-in',
        signOut: '/admin/sign-out',
        callback: '/admin/callback',
      },
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

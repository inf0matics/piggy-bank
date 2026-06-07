// Protects authenticated /admin/** pages. Redirects unauthenticated visitors
// back to the public admin landing page.
//
// Normally auth is the Logto session (`useLogtoUser()`, SSR-seeded so it works
// on both initial load and client navigation). When `adminAuthMode === 'e2e'`
// (set only in the e2e stack) an `e2e_admin` cookie counts as authenticated, so
// the CRUD tests can run without a real Logto tenant. See server/utils/requireAdmin.ts.
export default defineNuxtRouteMiddleware(() => {
  const { adminAuthMode } = useRuntimeConfig().public

  const authed = adminAuthMode === 'e2e'
    ? !!useCookie('e2e_admin').value
    : !!useLogtoUser()

  if (!authed) {
    return navigateTo('/admin')
  }
})

// Protects authenticated /admin/** pages. Redirects unauthenticated visitors
// back to the public admin landing page. `useLogtoUser()` is SSR-seeded and
// hydrates to the client, so this works on both initial load and navigation.
export default defineNuxtRouteMiddleware(() => {
  if (!useLogtoUser()) {
    return navigateTo('/admin')
  }
})

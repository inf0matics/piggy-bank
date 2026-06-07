import type { H3Event } from 'h3'

// Guards /api/admin/** handlers. Mirrors middleware/admin-auth.ts: real Logto
// session by default, or an `e2e_admin` cookie when adminAuthMode === 'e2e'.
// Throws 401 when unauthenticated.
export const requireAdmin = (event: H3Event): void => {
  const { adminAuthMode } = useRuntimeConfig(event).public

  const authed = adminAuthMode === 'e2e'
    ? !!getCookie(event, 'e2e_admin')
    : !!event.context.logtoUser

  if (!authed) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

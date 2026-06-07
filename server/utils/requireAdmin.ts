import type { H3Event } from 'h3'

export interface AdminIdentity {
  /** Stable Logto user id — the ownership key for piggy banks. */
  sub: string
  name?: string
  username?: string
  email?: string
}

// Resolves the current admin custodian. Mirrors middleware/admin-auth.ts: real
// Logto session by default, or a fixed identity when adminAuthMode === 'e2e' and
// the `e2e_admin` cookie is present. Returns null when unauthenticated.
export const getAdminIdentity = (event: H3Event): AdminIdentity | null => {
  const { adminAuthMode } = useRuntimeConfig(event).public

  if (adminAuthMode === 'e2e') {
    return getCookie(event, 'e2e_admin')
      ? { sub: 'e2e-admin', name: 'E2E Admin', username: 'e2e' }
      : null
  }

  const claims = event.context.logtoUser as {
    sub?: string
    name?: string | null
    username?: string | null
    email?: string | null
  } | undefined

  if (!claims?.sub) {
    return null
  }
  return {
    sub: claims.sub,
    name: claims.name ?? undefined,
    username: claims.username ?? undefined,
    email: claims.email ?? undefined,
  }
}

/** Guards /api/admin/** handlers and returns the current custodian. Throws 401. */
export const requireAdmin = (event: H3Event): AdminIdentity => {
  const identity = getAdminIdentity(event)
  if (!identity) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return identity
}

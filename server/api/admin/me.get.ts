import type { UserInfoResponse } from '@logto/node'

// Connector targets we treat as "LNURL-auth". Logto keys `identities` by the
// connector target, which is operator-configured, so we match any target that
// mentions lnurl rather than hard-coding a single string.
const isLnurlTarget = (target: string) => /lnurl/i.test(target)

// Returns the logged-in custodian's Logto identity for the Settings display,
// plus the account-center link and whether the account is linked via LNURL-auth.
//
// The social-connector `identities` only come from Logto's userinfo endpoint
// (they are absent from the ID token), so we fetch userinfo on demand here
// rather than on every request via the global Logto handler.
export default defineEventHandler(async (event) => {
  const identity = requireAdmin(event)

  const { logto } = useRuntimeConfig(event)
  const accountCenterUrl = logto.endpoint
    ? new URL('/account/security', logto.endpoint).href
    : null

  let lnurlAuth: boolean | null = null
  const client = event.context.logtoClient
  if (client) {
    try {
      const userInfo: UserInfoResponse = await client.fetchUserInfo()
      const identities = userInfo.identities ?? {}
      lnurlAuth = Object.keys(identities).some(isLnurlTarget)
    }
    catch {
      // Userinfo unreachable or the session lacks the `identities` scope (e.g.
      // a token issued before it was requested): leave the status unknown.
      lnurlAuth = null
    }
  }

  return { ...identity, accountCenterUrl, lnurlAuth }
})

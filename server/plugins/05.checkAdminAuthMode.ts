import { consola } from 'consola'
import { e2eAdminAuthRefused } from '../utils/adminAuthMode'

// The e2e admin shim (NUXT_PUBLIC_ADMIN_AUTH_MODE=e2e) makes any request with
// an `e2e_admin` cookie an admin. Outside `nuxt dev` the app refuses to start
// with it unless ALLOW_E2E_ADMIN_AUTH=true, which only the e2e stack sets, so
// a copied compose file can never open the admin area on a server.
export default defineNitroPlugin(() => {
  const { adminAuthMode } = useRuntimeConfig().public
  if (e2eAdminAuthRefused({ adminAuthMode: String(adminAuthMode ?? ''), dev: import.meta.dev, allow: process.env.ALLOW_E2E_ADMIN_AUTH })) {
    consola.error('[admin-auth] NUXT_PUBLIC_ADMIN_AUTH_MODE=e2e lets anyone with an `e2e_admin` cookie in as admin. Refusing to start: remove it, or set ALLOW_E2E_ADMIN_AUTH=true for the e2e test stack only.')
    throw new Error('NUXT_PUBLIC_ADMIN_AUTH_MODE=e2e without ALLOW_E2E_ADMIN_AUTH=true')
  }
})

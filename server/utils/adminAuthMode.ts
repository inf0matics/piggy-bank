/**
 * Whether the app must refuse to start: the e2e admin shim (any request with
 * an `e2e_admin` cookie is an admin) outside `nuxt dev`, without the explicit
 * ALLOW_E2E_ADMIN_AUTH=true that only the e2e stack sets.
 */
export const e2eAdminAuthRefused = ({ adminAuthMode, dev, allow }: { adminAuthMode: string, dev: boolean, allow: string | undefined }): boolean =>
  adminAuthMode === 'e2e' && !dev && allow !== 'true'

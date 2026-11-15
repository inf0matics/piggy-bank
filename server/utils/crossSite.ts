export interface CheckedRequest {
  method: string
  /** The request path, query included. */
  path: string
  /** This app's own host, as the request names it (Host or X-Forwarded-Host). */
  host: string
  secFetchSite?: string
  origin?: string
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

// @logto/nuxt signs out on a GET. Another site's <img> pointing there would
// sign the admin out, so it is checked like a write.
const SIGN_OUT_PATH = '/admin/sign-out'

/**
 * Whether a write was sent by a page that is not this app.
 *
 * The Logto session cookie is SameSite=Lax, which keeps it from other sites but
 * not from the other subdomains of tsp.tools (customer previews included): to
 * the browser those are the same site. A page there could post a form, or a
 * text/plain body that h3's readBody still parses as JSON, to /api/admin/* with
 * the admin's cookie.
 *
 * Sec-Fetch-Site names the sender exactly, and every current browser sends it.
 * Where it is missing, Origin decides and must be this app (`null` is not). A
 * request with neither comes from no browser, so it carries no cookie it did
 * not get by signing in itself.
 */
export const isCrossSiteRequest = ({ method, path, host, secFetchSite, origin }: CheckedRequest): boolean => {
  if (SAFE_METHODS.has(method.toUpperCase()) && pathnameOf(path) !== SIGN_OUT_PATH) return false

  if (secFetchSite !== undefined) return secFetchSite !== 'same-origin' && secFetchSite !== 'none'
  if (origin !== undefined) return originHost(origin) !== host
  return false
}

// The pathname as h3's getRequestURL gives it, which is what @logto/nuxt
// matches its routes on: leading slashes and backslashes collapsed, then
// parsed as a URL (backslashes become slashes, dot segments resolve).
const pathnameOf = (path: string): string => {
  try {
    return new URL(path.replace(/^[/\\]+/, '/'), 'http://localhost').pathname
  } catch {
    return path
  }
}

const originHost = (origin: string): string | null => {
  try {
    return new URL(origin).host
  } catch {
    // "null": a sandboxed frame, a file, a redirect across origins.
    return null
  }
}

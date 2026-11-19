// Counts attempts per key (a client IP, a custodian) in a fixed window and
// says when a key has used them up. In memory: the app is one container, and a
// restart only gives an attacker one fresh window.

export interface AttemptLimit {
  /** Whether `key` has reached the limit in its current window. */
  blocked: (key: string) => boolean
  /** Counts one attempt for `key`. */
  record: (key: string) => void
  /** Keys held (tests). */
  size: () => number
}

export const createAttemptLimit = ({ max, windowMs, now = Date.now }: { max: number, windowMs: number, now?: () => number }): AttemptLimit => {
  const windows = new Map<string, { count: number, resetAt: number }>()

  const current = (key: string) => {
    const entry = windows.get(key)
    return entry && entry.resetAt > now() ? entry : undefined
  }

  return {
    blocked: key => (current(key)?.count ?? 0) >= max,
    record: (key) => {
      const time = now()
      // Windows are added in the order they end, so the expired ones are first.
      for (const [k, entry] of windows) {
        if (entry.resetAt > time) break
        windows.delete(k)
      }
      const entry = windows.get(key)
      if (entry) entry.count += 1
      else windows.set(key, { count: 1, resetAt: time + windowMs })
    },
    size: () => windows.size,
  }
}

/**
 * The client's address: the last X-Forwarded-For entry, which Traefik (the
 * only way in) appends, else the socket's address.
 */
export const clientIp = (forwardedFor: string | undefined, remoteAddress: string | undefined): string =>
  forwardedFor?.split(',').at(-1)?.trim() || remoteAddress || 'unknown'

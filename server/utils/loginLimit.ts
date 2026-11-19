// Limits failed PIN logins per client address. In memory: the app is one
// container, and a restart only gives an attacker one fresh window.

export interface LoginLimit {
  /** How long `key` must wait before its next attempt, in ms; 0 when it may try now. */
  retryAfter: (key: string) => number
  /** Counts an attempt of `key` as soon as it arrives. */
  record: (key: string) => void
  /**
   * Settles one recorded attempt once its answer is known: a failure keeps
   * counting, anything else is given back. Returns the length of the block in
   * ms when this failure locked `key` out, else 0.
   */
  settle: (key: string, failed: boolean) => number
  /** Addresses held (tests). */
  size: () => number
}

interface Entry {
  /** Attempts in the current window. */
  count: number
  /** When the current window, or the block, ends. */
  resetAt: number
  /** Whether the current window ended in a lockout, which lasts until `resetAt`. */
  locked: boolean
  /** Lockouts so far that are still remembered. */
  strikes: number
  /** When the entry has nothing left to remember. */
  forgetAt: number
}

/**
 * `max` attempts per `windowMs` per address. The failure that reaches the
 * limit locks the address out for `penaltiesMs[0]`, a repeat lockout for the
 * next penalty, and so on up to the last one. Lockouts are forgotten
 * `forgetMs` after the last block ended.
 */
export const createLoginLimit = ({ max, windowMs, penaltiesMs, forgetMs, now = Date.now }: {
  max: number
  windowMs: number
  penaltiesMs: number[]
  forgetMs: number
  now?: () => number
}): LoginLimit => {
  const entries = new Map<string, Entry>()
  let nextSweep = 0

  const sweep = (time: number) => {
    if (time < nextSweep) return
    nextSweep = time + windowMs
    for (const [key, entry] of entries) {
      if (entry.forgetAt <= time) entries.delete(key)
    }
  }

  /** The entry of `key` while its window or block is running. */
  const live = (key: string, time: number) => {
    const entry = entries.get(key)
    return entry && entry.resetAt > time ? entry : undefined
  }

  return {
    retryAfter: (key) => {
      const time = now()
      const entry = live(key, time)
      return entry && (entry.locked || entry.count >= max) ? entry.resetAt - time : 0
    },
    record: (key) => {
      const time = now()
      sweep(time)
      const entry = entries.get(key)
      if (entry && entry.resetAt > time) {
        entry.count += 1
        return
      }
      const strikes = entry && entry.forgetAt > time ? entry.strikes : 0
      const resetAt = time + windowMs
      entries.set(key, { count: 1, resetAt, locked: false, strikes, forgetAt: Math.max(resetAt, strikes ? entry!.forgetAt : 0) })
    },
    settle: (key, failed) => {
      const time = now()
      const entry = live(key, time)
      if (!entry || entry.locked) return 0
      if (!failed) {
        entry.count -= 1
        if (entry.count <= 0 && entry.strikes === 0) entries.delete(key)
        return 0
      }
      if (entry.count < max) return 0
      const block = penaltiesMs[Math.min(entry.strikes, penaltiesMs.length - 1)]!
      entry.locked = true
      entry.strikes += 1
      entry.resetAt = time + block
      entry.forgetAt = entry.resetAt + forgetMs
      return block
    },
    size: () => entries.size,
  }
}

/**
 * The client's address: the last X-Forwarded-For entry, which Traefik (the
 * only way in) appends, else the socket's address.
 */
export const clientIp = (forwardedFor: string | undefined, remoteAddress: string | undefined): string =>
  forwardedFor?.split(',').at(-1)?.trim() || remoteAddress || 'unknown'

/**
 * Whether `pathname` is the child login, however it is spelled: the router
 * also serves it percent-encoded, with doubled or trailing slashes.
 */
export const isLoginPath = (pathname: string): boolean => {
  let path: string
  try {
    path = decodeURIComponent(pathname)
  } catch {
    return false
  }
  return path.replace(/\/{2,}/g, '/').replace(/\/+$/, '').toLowerCase() === '/api/auth/login'
}

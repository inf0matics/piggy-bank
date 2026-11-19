import { clientIp, createAttemptLimit } from '../utils/attemptLimit'

// The child login has the PIN as its only secret and no username, so failed
// attempts are limited per client address: after 10 within 10 minutes the
// address gets 429 until its window ends, the right PIN included. Successful
// logins do not count.
const failedLogins = createAttemptLimit({ max: 10, windowMs: 10 * 60_000 })

export default defineEventHandler((event) => {
  if (event.method !== 'POST' || getRequestURL(event).pathname !== '/api/auth/login') return

  const ip = clientIp(getRequestHeader(event, 'x-forwarded-for'), event.node.req.socket.remoteAddress)
  if (failedLogins.blocked(ip)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many attempts. Try again in a few minutes.' })
  }
  event.node.res.once('finish', () => {
    if (event.node.res.statusCode === 401) failedLogins.record(ip)
  })
})

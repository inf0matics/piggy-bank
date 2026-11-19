import { clientIp, createAttemptLimit, isLoginPath } from '../utils/attemptLimit'

// The child login has the PIN as its only secret and no username, so failed
// attempts are limited per client address: after 10 within 10 minutes the
// address gets 429 until its window ends, the right PIN included. Each attempt
// counts as soon as it arrives, so parallel guesses cannot all pass the check
// before the first one fails; it is given back once its answer is not a 401.
const failedLogins = createAttemptLimit({ max: 10, windowMs: 10 * 60_000 })

export default defineEventHandler((event) => {
  if (event.method !== 'POST' || !isLoginPath(getRequestURL(event).pathname)) return

  const ip = clientIp(getRequestHeader(event, 'x-forwarded-for'), event.node.req.socket.remoteAddress)
  if (failedLogins.blocked(ip)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many attempts. Try again in a few minutes.' })
  }
  failedLogins.record(ip)
  event.node.res.once('close', () => {
    if (event.node.res.statusCode !== 401) failedLogins.release(ip)
  })
})

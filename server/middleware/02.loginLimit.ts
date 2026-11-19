import { consola } from 'consola'
import { clientIp, createLoginLimit, isLoginPath } from '../utils/loginLimit'

const MINUTE = 60_000

// The child login has the PIN as its only secret and no username, so failed
// attempts are limited per client address, the right PIN included once
// blocked. Each attempt counts as soon as it arrives, so parallel guesses
// cannot all pass the check before the first one fails; it is settled once its
// answer is known. Failed and blocked attempts are logged with the address.
const failedLogins = createLoginLimit({
  max: 10,
  windowMs: 10 * MINUTE,
  penaltiesMs: [10 * MINUTE, 60 * MINUTE, 24 * 60 * MINUTE],
  forgetMs: 24 * 60 * MINUTE,
})

const minutes = (ms: number) => Math.ceil(ms / MINUTE)

export default defineEventHandler((event) => {
  if (event.method !== 'POST' || !isLoginPath(getRequestURL(event).pathname)) return

  const ip = clientIp(getRequestHeader(event, 'x-forwarded-for'), event.node.req.socket.remoteAddress)
  const wait = failedLogins.retryAfter(ip)
  if (wait > 0) {
    consola.warn(`[login] refused an attempt from ${ip}: blocked for ${minutes(wait)} more min`)
    setResponseHeader(event, 'Retry-After', Math.ceil(wait / 1000))
    throw createError({ statusCode: 429, statusMessage: 'Too many attempts. Try again later.' })
  }
  failedLogins.record(ip)
  event.node.res.once('close', () => {
    const failed = event.node.res.statusCode === 401
    if (failed) consola.warn(`[login] failed PIN login from ${ip}`)
    const block = failedLogins.settle(ip, failed)
    if (block) consola.warn(`[login] blocked ${ip} for ${minutes(block)} min after too many failed PIN logins`)
  })
})

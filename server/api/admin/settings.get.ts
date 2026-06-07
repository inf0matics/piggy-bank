import { DEFAULT_LNBITS_URL_KEY } from '~/server/domain/settings'

export default defineEventHandler((event) => {
  const admin = requireAdmin(event)
  return { defaultLnbitsUrl: getSetting(`${DEFAULT_LNBITS_URL_KEY}:${admin.sub}`) ?? '' }
})

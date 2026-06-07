import { DEFAULT_LNBITS_URL_KEY } from '~/server/domain/settings'

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const body = await readBody(event)
  const defaultLnbitsUrl = String(body?.defaultLnbitsUrl ?? '').trim()
  setSetting(`${DEFAULT_LNBITS_URL_KEY}:${admin.sub}`, defaultLnbitsUrl)

  return { defaultLnbitsUrl }
})

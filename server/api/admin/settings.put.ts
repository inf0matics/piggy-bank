import { DEFAULT_LNBITS_URL_KEY, DEFAULT_MARBLES_URL_KEY, SettingsInputSchema } from '~/server/domain/settings'

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const parsed = SettingsInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Invalid input' })
  }

  const { defaultLnbitsUrl, defaultMarblesUrl } = parsed.data
  setSetting(`${DEFAULT_LNBITS_URL_KEY}:${admin.sub}`, defaultLnbitsUrl)
  setSetting(`${DEFAULT_MARBLES_URL_KEY}:${admin.sub}`, defaultMarblesUrl)

  return { defaultLnbitsUrl, defaultMarblesUrl }
})

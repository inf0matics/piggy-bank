import { UserInputSchema } from '~/server/domain/user'
import { pinChanges } from '~/server/utils/pinChange'

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const parsed = UserInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Invalid input' })
  }

  const refusal = pinChanges.refusal(admin.sub, parsed.data.accessKey)
  if (refusal) throw createError(refusal)

  try {
    return insertUser(parsed.data, admin.sub)
  } catch (error) {
    if (String((error as Error)?.message).includes('UNIQUE')) throw createError(pinChanges.recordConflict(admin.sub))
    throw error
  }
})

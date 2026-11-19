import { UserInputSchema } from '~/server/domain/user'
import { checkPinChange, pinInUse } from '~/server/utils/pinChange'

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const parsed = UserInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Invalid input' })
  }

  checkPinChange(admin.sub, parsed.data.accessKey)

  try {
    return insertUser(parsed.data, admin.sub)
  } catch (error) {
    if (String((error as Error)?.message).includes('UNIQUE')) throw pinInUse(admin.sub)
    throw error
  }
})

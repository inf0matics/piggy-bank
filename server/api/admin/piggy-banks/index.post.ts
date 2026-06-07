import { UserInputSchema } from '~/server/domain/user'

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const parsed = UserInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Invalid input' })
  }

  try {
    return insertUser(parsed.data, admin.sub)
  } catch (error) {
    if (String((error as Error)?.message).includes('UNIQUE')) {
      throw createError({ statusCode: 409, statusMessage: 'PIN is already in use' })
    }
    throw error
  }
})

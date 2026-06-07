import { UserInputSchema } from '~/server/domain/user'

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const id = getRouterParam(event, 'id') as string
  const parsed = UserInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Invalid input' })
  }

  let updated
  try {
    updated = updateOwnedUser(id, admin.sub, parsed.data)
  } catch (error) {
    if (String((error as Error)?.message).includes('UNIQUE')) {
      throw createError({ statusCode: 409, statusMessage: 'PIN is already in use' })
    }
    throw error
  }

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Piggy bank not found' })
  }
  return updated
})

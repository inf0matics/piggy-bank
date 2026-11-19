import { pinError } from '../domain/user'
import { createAttemptLimit } from './attemptLimit'

// PINs are unique across all custodians, so "PIN is already in use" tells a
// custodian that some child somewhere logs in with that PIN. After 5 such
// conflicts in an hour a custodian cannot set any new PIN until the hour is
// over, so the answer stops being a way to search for PINs.
const conflicts = createAttemptLimit({ max: 5, windowMs: 60 * 60_000 })

/**
 * Throws when `pin` cannot be set by `owner`: too short (400), or the owner
 * has used up their PIN conflicts (429). An unchanged `current` PIN passes.
 */
export const checkPinChange = (owner: string, pin: string, current?: string): void => {
  const error = pinError(pin, current)
  if (error) throw createError({ statusCode: 400, statusMessage: error })
  if (pin !== current && conflicts.blocked(owner)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many PINs already in use. Try again in an hour.' })
  }
}

/** The 409 for a PIN another piggy bank has, counted against `owner`. */
export const pinInUse = (owner: string) => {
  conflicts.record(owner)
  return createError({ statusCode: 409, statusMessage: 'PIN is already in use' })
}

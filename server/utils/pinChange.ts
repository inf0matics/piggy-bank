import { pinError } from '../domain/user.ts'
import { type AttemptLimit, createAttemptLimit } from './attemptLimit.ts'

interface Refusal { statusCode: number, statusMessage: string }

/**
 * PINs are unique across all custodians, so "PIN is already in use" tells a
 * custodian that some child somewhere logs in with that PIN. The guard counts
 * those conflicts per custodian in `conflicts`; once it is used up, the
 * custodian cannot set any new PIN until its window ends, so the answer stops
 * being a way to search for PINs.
 */
export const createPinChangeGuard = (conflicts: AttemptLimit) => ({
  /** Why `owner` cannot set `pin` (400 too short, 429 too many conflicts), or null. An unchanged `current` PIN passes. */
  refusal: (owner: string, pin: string, current?: string): Refusal | null => {
    const error = pinError(pin, current)
    if (error) return { statusCode: 400, statusMessage: error }
    if (pin !== current && conflicts.blocked(owner)) {
      return { statusCode: 429, statusMessage: 'Too many PINs already in use. Try again in an hour.' }
    }
    return null
  },
  /** The 409 for a PIN another piggy bank has, counted against `owner`. */
  recordConflict: (owner: string): Refusal => {
    conflicts.record(owner)
    return { statusCode: 409, statusMessage: 'PIN is already in use' }
  },
})

/** The app's guard: 5 conflicts per custodian per hour. */
export const pinChanges = createPinChangeGuard(createAttemptLimit({ max: 5, windowMs: 60 * 60_000 }))

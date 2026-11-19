// The PIN-conflict limit: "PIN is already in
// use" tells a custodian that some family uses that PIN, so after 5 conflicts
// in an hour that custodian cannot set a new PIN until the hour is over.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createAttemptLimit } from '../../server/utils/attemptLimit.ts'
import { createPinChangeGuard } from '../../server/utils/pinChange.ts'

const guard = () => createPinChangeGuard(createAttemptLimit({ max: 5, windowMs: 60 * 60_000 }))

describe('createPinChangeGuard', () => {
  it('refuses a PIN shorter than 4 characters with 400', () => {
    assert.deepEqual(guard().refusal('anna', '123'), { statusCode: 400, statusMessage: 'The PIN needs at least 4 characters' })
    assert.equal(guard().refusal('anna', '1234'), null)
  })

  it('blocks a new PIN after 5 conflicts, for that custodian only', () => {
    const pins = guard()
    for (let i = 0; i < 4; i++) assert.equal(pins.recordConflict('anna').statusCode, 409)
    assert.equal(pins.refusal('anna', '5555'), null)
    assert.deepEqual(pins.recordConflict('anna'), { statusCode: 409, statusMessage: 'PIN is already in use' })
    assert.deepEqual(pins.refusal('anna', '5555'), { statusCode: 429, statusMessage: 'Too many PINs already in use. Try again in an hour.' })
    assert.equal(pins.refusal('ben', '5555'), null)
  })

  it('still lets a blocked custodian save a piggy bank whose PIN stays the same', () => {
    const pins = guard()
    for (let i = 0; i < 5; i++) pins.recordConflict('anna')
    assert.equal(pins.refusal('anna', '12', '12'), null)
    assert.equal(pins.refusal('anna', '5555', '5555'), null)
  })
})

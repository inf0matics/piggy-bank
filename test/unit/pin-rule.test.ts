// A child's PIN is the only secret of the child login, so a new or changed PIN
// needs at least PIN_MIN_LENGTH characters. A PIN made before the rule keeps
// working until it is changed (security audit before v1.19).
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { PIN_MIN_LENGTH, pinError } from '../../server/domain/user.ts'

describe('pinError', () => {
  it('needs at least 4 characters for a new PIN', () => {
    assert.equal(PIN_MIN_LENGTH, 4)
    assert.match(pinError('123') ?? '', /at least 4 characters/)
    assert.equal(pinError('1234'), null)
    assert.equal(pinError('secret-pin'), null)
  })

  it('accepts a short PIN that is not changed', () => {
    assert.equal(pinError('12', '12'), null)
  })

  it('refuses a changed PIN that is short, even if the old one was short too', () => {
    assert.match(pinError('13', '12') ?? '', /at least 4 characters/)
  })
})

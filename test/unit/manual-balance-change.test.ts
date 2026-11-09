// A manual balance is changed in EUR: a plain amount sets it, +/- adds or
// subtracts, converted to sats at the current rate (spec admin-11).
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ManualBalanceChangeInputSchema } from '../../server/domain/user.ts'
import { applyManualChange, eurChangeToSats, parseEurChange } from '../../utils/manualBalanceChange.ts'

describe('parseEurChange', () => {
  it('reads a plain amount as setting the balance', () => {
    assert.deepEqual(parseEurChange('25'), { mode: 'set', eur: 25 })
    assert.deepEqual(parseEurChange(' 0 '), { mode: 'set', eur: 0 })
  })

  it('reads + and - (hyphen or minus sign) as adding and subtracting', () => {
    assert.deepEqual(parseEurChange('+10'), { mode: 'add', eur: 10 })
    assert.deepEqual(parseEurChange('-10'), { mode: 'add', eur: -10 })
    assert.deepEqual(parseEurChange('−10'), { mode: 'add', eur: -10 })
    assert.deepEqual(parseEurChange('+ 2.5'), { mode: 'add', eur: 2.5 })
  })

  it('takes up to two decimals, with a point or a comma', () => {
    assert.deepEqual(parseEurChange('10.50'), { mode: 'set', eur: 10.5 })
    assert.deepEqual(parseEurChange('-0,99'), { mode: 'add', eur: -0.99 })
  })

  it('refuses anything else instead of guessing', () => {
    // '1,000' could be a thousands separator: refused, not read as 1 EUR.
    for (const input of ['', ' ', 'abc', '+', '1,000', '10.123', '1e3', '10 EUR', '--5', '+-5', '.5', '5.']) {
      assert.equal(parseEurChange(input), null, JSON.stringify(input))
    }
  })
})

describe('eurChangeToSats', () => {
  it('converts at the rate, rounding to whole sats', () => {
    assert.deepEqual(eurChangeToSats({ mode: 'add', eur: 10 }, 50_000), { mode: 'add', sats: 20_000 })
    assert.deepEqual(eurChangeToSats({ mode: 'add', eur: -10 }, 50_000), { mode: 'add', sats: -20_000 })
    assert.deepEqual(eurChangeToSats({ mode: 'set', eur: 25 }, 50_000), { mode: 'set', sats: 50_000 })
    // 10 / 81,000 BTC = 12,345.679 sats
    assert.deepEqual(eurChangeToSats({ mode: 'add', eur: 10 }, 81_000), { mode: 'add', sats: 12_346 })
    assert.deepEqual(eurChangeToSats({ mode: 'add', eur: -10 }, 81_000), { mode: 'add', sats: -12_346 })
  })
})

describe('applyManualChange', () => {
  it('adds, subtracts and sets, reporting the change in sats', () => {
    assert.deepEqual(applyManualChange(100_000, { mode: 'add', sats: 20_000 }), { sats: 120_000, delta: 20_000 })
    assert.deepEqual(applyManualChange(100_000, { mode: 'add', sats: -20_000 }), { sats: 80_000, delta: -20_000 })
    assert.deepEqual(applyManualChange(100_000, { mode: 'set', sats: 50_000 }), { sats: 50_000, delta: -50_000 })
    assert.deepEqual(applyManualChange(100_000, { mode: 'add', sats: -100_000 }), { sats: 0, delta: -100_000 })
  })

  it('refuses a balance below zero', () => {
    assert.deepEqual(applyManualChange(100_000, { mode: 'add', sats: -100_001 }), { error: 'The balance cannot go below zero' })
  })

  it('refuses a change that changes nothing', () => {
    assert.deepEqual(applyManualChange(100_000, { mode: 'add', sats: 0 }), { error: 'Nothing to change' })
    assert.deepEqual(applyManualChange(100_000, { mode: 'set', sats: 100_000 }), { error: 'Nothing to change' })
  })

  it('refuses more than the 21M BTC supply', () => {
    assert.deepEqual(applyManualChange(2_100_000_000_000_000, { mode: 'add', sats: 1 }), { error: 'The balance cannot exceed 21 million BTC' })
  })
})

describe('ManualBalanceChangeInputSchema', () => {
  it('takes a set or add in whole sats with an optional comment', () => {
    assert.deepEqual(ManualBalanceChangeInputSchema.parse({ mode: 'add', sats: -5, comment: '  Typo  ' }), { mode: 'add', sats: -5, comment: 'Typo' })
    assert.deepEqual(ManualBalanceChangeInputSchema.parse({ mode: 'set', sats: 0 }), { mode: 'set', sats: 0, comment: null })
    assert.deepEqual(ManualBalanceChangeInputSchema.parse({ mode: 'set', sats: 1, comment: '   ' }), { mode: 'set', sats: 1, comment: null })
  })

  it('rejects anything else', () => {
    for (const body of [
      {},
      { mode: 'add', sats: 1.5 },
      { mode: 'add', sats: '10' },
      { mode: 'set', sats: -1 },
      { mode: 'multiply', sats: 2 },
      { mode: 'set', sats: 2_100_000_000_000_001 },
      { mode: 'add', sats: 1, comment: 'x'.repeat(201) },
      { mode: 'add', sats: 1, comment: 5 },
    ]) {
      assert.equal(ManualBalanceChangeInputSchema.safeParse(body).success, false, JSON.stringify(body))
    }
  })
})

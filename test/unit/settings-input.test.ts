// The custodian's default URLs: each empty or an http(s) URL of sane length.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { SettingsInputSchema } from '../../server/domain/settings.ts'

describe('SettingsInputSchema', () => {
  it('accepts http(s) URLs and trims them', () => {
    assert.deepEqual(
      SettingsInputSchema.parse({ defaultLnbitsUrl: ' https://lnbits.example.com ', defaultMarblesUrl: 'http://marbles-mock' }),
      { defaultLnbitsUrl: 'https://lnbits.example.com', defaultMarblesUrl: 'http://marbles-mock' },
    )
  })

  it('treats a missing or empty field as no default', () => {
    assert.deepEqual(SettingsInputSchema.parse({ defaultLnbitsUrl: 'http://lnbits-mock' }), { defaultLnbitsUrl: 'http://lnbits-mock', defaultMarblesUrl: '' })
    assert.deepEqual(SettingsInputSchema.parse({ defaultLnbitsUrl: '  ', defaultMarblesUrl: '' }), { defaultLnbitsUrl: '', defaultMarblesUrl: '' })
  })

  it('refuses what is not an http(s) URL', () => {
    for (const value of ['not a url', 'javascript:alert(1)', 'ftp://example.com', 42]) {
      assert.equal(SettingsInputSchema.safeParse({ defaultLnbitsUrl: value }).success, false, String(value))
      assert.equal(SettingsInputSchema.safeParse({ defaultMarblesUrl: value }).success, false, String(value))
    }
  })

  it('refuses an overlong URL', () => {
    const long = `https://example.com/${'a'.repeat(2048)}`
    assert.equal(SettingsInputSchema.safeParse({ defaultLnbitsUrl: long }).success, false)
  })

  it('refuses unknown fields', () => {
    assert.equal(SettingsInputSchema.safeParse({ defaultLnbitsUrl: '', other: 'x' }).success, false)
  })
})

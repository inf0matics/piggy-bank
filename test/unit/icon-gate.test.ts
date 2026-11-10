// Spec admin-08 step 5: the icon gate reads the app container's log after the
// e2e run. The detector is the theme's (`/gates`); this pins how ours uses it.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { iconFailures } from '@thespielplatz/tsp-tools-theme/gates'
import { checkIconLog } from '../../e2e/helpers/iconGate.ts'

describe('checkIconLog', () => {
  it('passes a clean log', () => {
    assert.doesNotThrow(() => checkIconLog('Listening on http://0.0.0.0:3000\n'))
  })

  it('fails on a failed icon load', () => {
    assert.throws(
      () => checkIconLog('piggybank-1  | [Icon] failed to load icon `tabler:pig-money`\n'),
      /tabler:pig-money/,
    )
  })

  it('fails on an icon load that timed out', () => {
    assert.throws(
      () => checkIconLog('[Icon] loading icon `tabler:x` timed out after 1500ms'),
      /timed out/,
    )
  })

  it('fails when the detector no longer recognises @nuxt/icon\'s wording', () => {
    assert.throws(() => checkIconLog('', () => ['[Icon] failed to load icon `x`']), /detector/)
  })
})

// The theme's own self-check (iconDetectorMisses) compares its regex with its
// own sample strings, so it cannot notice @nuxt/icon rewording its warnings.
// This reads the warnings from the @nuxt/icon actually installed.
describe('the icon detector against the installed @nuxt/icon', () => {
  const source = readFileSync('node_modules/@nuxt/icon/dist/runtime/components/shared.js', 'utf8')
  const warnings = [...source.matchAll(/console\.warn\(`(\[Icon\][^`]*(?:\\`[^`]*)*)`\)/g)]
    .map(([, template = '']) => template.replaceAll('\\`', '`').replace(/\$\{[^}]+\}/g, 'x'))

  it('finds both runtime failure warnings in @nuxt/icon', () => {
    assert.equal(warnings.length, 2, `@nuxt/icon's warnings changed: ${JSON.stringify(warnings)}`)
  })

  for (const [i, warning] of warnings.entries()) {
    it(`recognises warning ${i + 1}: ${warning}`, () => {
      assert.equal(iconFailures(warning).length, 1)
    })
  }
})

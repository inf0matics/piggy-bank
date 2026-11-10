// Spec admin-08 step 5: the icon gate reads the app container's log after the
// e2e run. The detector is the theme's (`/gates`); this pins how ours uses it.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
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

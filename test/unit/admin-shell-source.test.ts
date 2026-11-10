// Spec admin-08: the admin frame and page headings are the theme layer's.
// Source checks, because a hand-built frame renders almost identically to the
// layer's until a phone's toolbar collapses — nothing rendered would catch one
// creeping back.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const read = (path: string) => readFileSync(path, 'utf8')
const templateOf = (source: string) => source.slice(source.indexOf('<template>'), source.lastIndexOf('</template>'))

const vueFiles = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name)
  if (statSync(path).isDirectory()) return vueFiles(path)
  return path.endsWith('.vue') ? [path] : []
})

describe('layouts/admin.vue', () => {
  const layout = read('layouts/admin.vue')
  const template = templateOf(layout)

  it('opens with <TspAppShell>', () => {
    assert.match(template, /^<template>\s*<TspAppShell[\s>]/)
  })

  it('has no frame of its own', () => {
    for (const frame of ['TspThemeProvider', 'TspContainer', '<main']) {
      assert.ok(!template.includes(frame), `${frame} is the shell's`)
    }
    for (const cls of ['flex', 'min-h-svh', 'min-h-screen', 'min-w-0', 'bg-default']) {
      assert.doesNotMatch(template, new RegExp(`class="[^"]*(?<![\\w-])${cls}(?![\\w-])`), `frame class ${cls}`)
    }
  })

  it('passes no #user or #logout slot to the sidebar footer', () => {
    assert.doesNotMatch(template, /#user\b|#logout\b|v-slot:user|v-slot:logout/)
  })

  it('passes the page title to the mobile top bar', () => {
    assert.match(template, /:top-title=/)
  })
})

describe('admin page headings', () => {
  it('only the logged-out landing hand-writes an <h1>', () => {
    const offenders = [...vueFiles('pages/admin'), ...vueFiles('components')]
      .filter(path => read(path).includes('<h1'))
    assert.deepEqual(offenders, ['pages/admin/index.vue'])
  })

  it('every page in the admin layout names itself for the top bar', () => {
    const pages = vueFiles('pages/admin').filter(path => /layout:\s*'admin'/.test(read(path)))
    assert.ok(pages.length >= 5)
    for (const path of pages) {
      assert.match(read(path), /definePageMeta\(\{[^}]*\btitle:\s*'[^']+'/, path)
    }
  })
})

describe('pages/admin/user.vue', () => {
  const template = templateOf(read('pages/admin/user.vue'))

  it('is the layer\'s account page', () => {
    assert.match(template, /<TspAccountPage[\s>]/)
  })

  it('renders the LNURL-auth line below the account page, not inside it', () => {
    const pageEnd = template.search(/<\/TspAccountPage>|<TspAccountPage[^>]*\/>/)
    const lnurl = template.indexOf('lnurl-auth-status')
    assert.ok(pageEnd >= 0 && lnurl > pageEnd, 'the status line follows the account page')
    assert.ok(!template.includes('</TspAccountPage>'), 'the account page takes no children')
  })
})

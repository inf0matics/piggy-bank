// The container runs as the unprivileged `node` user (uid 1000), and the
// directories the SQLite file may live in belong to it.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { describe, it } from 'node:test'

const dockerfile = fs.readFileSync(new URL('../../Dockerfile', import.meta.url), 'utf8')
// The runtime stage: everything after the last FROM.
const runtime = dockerfile.slice(dockerfile.lastIndexOf('\nFROM '))
const instructions = runtime.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'))

describe('Dockerfile runtime stage', () => {
  it('switches to the node user before the server starts', () => {
    const user = instructions.findIndex(line => /^USER\s+node$/.test(line))
    const cmd = instructions.findIndex(line => line.startsWith('CMD '))
    assert.ok(user !== -1, 'USER node is missing')
    assert.ok(user < cmd, 'USER node must come before CMD')
  })

  it('gives the node user the data directories before switching to it', () => {
    const chown = instructions.findIndex(line => /chown\s+node:node\b.*\/data\b.*\/app\/data\b/.test(line))
    const user = instructions.findIndex(line => /^USER\s+node$/.test(line))
    assert.ok(chown !== -1, 'the data directories are not handed to node')
    assert.ok(chown < user)
  })
})

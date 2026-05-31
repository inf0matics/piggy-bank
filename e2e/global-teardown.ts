import { execSync } from 'node:child_process'

const COMPOSE_FILE = 'docker-compose.e2e.yml'

// Tears the stack down after the run. Set E2E_KEEP_STACK=1 to leave it running
// (useful when iterating on tests locally).
export default function globalTeardown() {
  if (process.env.E2E_KEEP_STACK) {
    console.log('[e2e] E2E_KEEP_STACK set, leaving stack running')
    return
  }
  console.log('[e2e] stopping docker compose stack...')
  execSync(`docker compose -f ${COMPOSE_FILE} down --volumes --remove-orphans`, {
    stdio: 'inherit',
  })

  // Remove dangling images left behind by `up --build`: on each rebuild the
  // previous app image loses its tag and becomes <none>. This prunes only
  // untagged, unused images (safe). Build cache and the current tagged images
  // are kept on purpose so the next rebuild stays fast.
  console.log('[e2e] pruning dangling docker images...')
  try {
    execSync('docker image prune -f', { stdio: 'inherit' })
  } catch {
    console.warn('[e2e] docker image prune failed (ignored)')
  }
}

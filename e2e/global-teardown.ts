import { execSync } from 'node:child_process'
import { checkIconLog } from './helpers/iconGate'

const COMPOSE_FILE = 'docker-compose.e2e.yml'

function stopStack() {
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

// Runs the icon gate over the app's log, then tears the stack down. Set
// E2E_KEEP_STACK=1 to leave the stack running (useful when iterating on tests
// locally); the gate runs either way, and a failure fails the run.
export default function globalTeardown() {
  try {
    // A whole run's log can pass execSync's 1 MiB default buffer.
    const appLog = execSync(`docker compose -f ${COMPOSE_FILE} logs --no-color piggybank`, {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })
    checkIconLog(appLog)
    console.log('[e2e] icon gate: no icon failures in the app log')
  } finally {
    stopStack()
  }
}

import { execSync } from 'node:child_process'

const COMPOSE_FILE = 'docker-compose.e2e.yml'

// Brings the full E2E stack up before any tests run. `--wait` blocks until both
// services report healthy (see healthchecks in docker-compose.e2e.yml).
export default function globalSetup() {
  console.log('[e2e] starting docker compose stack...')
  execSync(`docker compose -f ${COMPOSE_FILE} up --build --wait --remove-orphans`, {
    stdio: 'inherit',
  })
  console.log('[e2e] stack is healthy')
}

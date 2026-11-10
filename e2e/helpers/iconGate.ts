import { iconDetectorMisses, iconFailures } from '@thespielplatz/tsp-tools-theme/gates'

// The icon gate (ADR 008, spec admin-08 step 5). Icons resolve at runtime, per
// request, so lint, typecheck and build stay green with every glyph missing.
// After the e2e run the app container's log is read and any @nuxt/icon runtime
// failure fails the run. The detector is the theme's, not a copy of it.
export const checkIconLog = (log: string, detectorMisses: () => string[] = iconDetectorMisses) => {
  const misses = detectorMisses()
  if (misses.length > 0) {
    throw new Error(`[icon gate] the detector no longer recognises @nuxt/icon's wording:\n${misses.join('\n')}`)
  }
  const failures = iconFailures(log)
  if (failures.length > 0) {
    throw new Error(`[icon gate] ${failures.length} icon failure(s) in the app log:\n${failures.join('\n')}`)
  }
}

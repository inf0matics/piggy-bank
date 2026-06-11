// Per-area colour mode. The public area (Piggy start page + piggy-bank
// functions) stays light; the admin area is dark by default. This replaces the
// previous global force-light plugin so the two surfaces can differ.
//
// The mode is derived purely from the route, never from a saved preference, so
// a value persisted by colour-mode (e.g. dark from a previous /admin visit)
// can't leak into the public area, and vice versa.
//
// @nuxtjs/color-mode persists a single global preference in localStorage and
// re-applies it from storage on mount. To stay authoritative we (a) set
// `preference`/`value` during setup (SSR + initial render) and on every route
// change, and (b) re-assert the `<html>` class on `app:mounted` *after*
// colour-mode has read storage — writing the class directly so route intent
// always wins regardless of plugin/mount ordering.
export default defineNuxtPlugin((nuxtApp) => {
  const colorMode = useColorMode()
  const route = useRoute()

  const modeForPath = (path: string) => (path.startsWith('/admin') ? 'dark' : 'light')

  const apply = (path: string) => {
    const mode = modeForPath(path)
    colorMode.preference = mode
    colorMode.value = mode
    if (import.meta.client) {
      const el = document.documentElement
      el.classList.remove('dark', 'light')
      el.classList.add(mode)
      el.style.colorScheme = mode
    }
  }

  apply(route.path)
  watch(() => route.path, apply)
  // Re-assert after colour-mode's own on-mount logic (which reads stale storage).
  nuxtApp.hook('app:mounted', () => nextTick(() => apply(route.path)))
})

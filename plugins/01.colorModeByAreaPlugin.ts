// Per-area colour mode. The public area (Piggy start page + piggy-bank
// functions) is always light; the admin area is user-toggleable, defaulting to
// dark. This replaces the previous global force-light plugin.
//
// The mode is derived from the route, never from colour-mode's own persisted
// value, so the two surfaces can't fight:
//   - public route  → always 'light'
//   - admin route   → the remembered admin preference (useAdminColorMode,
//                     default dark), kept in its own cookie so forcing the
//                     public area light never erases it.
//
// @nuxtjs/color-mode persists a single global value in localStorage and
// re-applies it from storage on mount, so we (a) set `preference`/`value`
// during setup (SSR + initial render), on every route change, and whenever the
// admin preference changes (the toggle), and (b) re-assert the `<html>` class on
// `app:mounted` — writing it directly so route intent always wins regardless of
// plugin/mount ordering.
export default defineNuxtPlugin((nuxtApp) => {
  const colorMode = useColorMode()
  const route = useRoute()
  const { pref: adminPref } = useAdminColorMode()

  const modeForPath = (path: string) =>
    path.startsWith('/admin') ? adminPref.value : 'light'

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
  // The sidebar toggle flips adminPref; re-apply when on an admin route.
  watch(adminPref, () => apply(route.path))
  // Re-assert after colour-mode's own on-mount logic (which reads stale storage).
  nuxtApp.hook('app:mounted', () => nextTick(() => apply(route.path)))
})

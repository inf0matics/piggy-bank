// The admin area's own colour-mode preference (light/dark), kept SEPARATE from
// @nuxtjs/color-mode's global state so that forcing the public area to light
// (see plugins/01.colorModeByAreaPlugin.ts) can never erase the admin choice.
//
// Persisted in a cookie so it is readable during SSR (the admin renders in the
// right mode server-side) and remembered across reloads. Dark is the default.
export type AdminColorMode = 'light' | 'dark'

export const useAdminColorMode = () => {
  const pref = useCookie<AdminColorMode>('piggy_admin_color_mode', {
    default: () => 'dark',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })

  const toggle = () => {
    pref.value = pref.value === 'dark' ? 'light' : 'dark'
  }

  return { pref, toggle }
}

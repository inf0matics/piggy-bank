// Returns the logged-in custodian's Logto identity for the Settings display.
export default defineEventHandler((event) => {
  return requireAdmin(event)
})

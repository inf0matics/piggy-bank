// The renderer names the framework on every page; nothing reads it but a scanner.
// Route rules and middleware run before the renderer sets it, so it is removed here.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event) => {
    removeResponseHeader(event, 'x-powered-by')
  })
})

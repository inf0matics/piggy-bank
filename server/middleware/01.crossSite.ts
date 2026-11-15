// Refuses a write (or the GET sign-out) that another page sent with the
// admin's cookie (isCrossSiteRequest). The message is constant: nothing from
// the request is echoed back.
export default defineEventHandler((event) => {
  const refused = isCrossSiteRequest({
    method: event.method,
    path: event.path,
    host: getRequestHost(event),
    secFetchSite: getRequestHeader(event, 'sec-fetch-site'),
    origin: getRequestHeader(event, 'origin'),
  })

  if (refused) {
    throw createError({ statusCode: 403, statusMessage: 'Writes are only accepted from this app' })
  }
})

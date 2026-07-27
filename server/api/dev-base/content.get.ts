import { z } from 'zod'

// Serves the footer's legal pages from the runtime `data/` directory:
//   GET /api/dev-base/content?file=legal-notice|privacy-policy
// Returns the raw HTML, or 404 when the file has not been provided.
const inputSchema = z.object({
  file: z.enum(['legal-notice', 'privacy-policy']),
})

export default defineEventHandler(async (event) => {
  const input = await getValidatedQuery(event, query => inputSchema.parse(query))
  const fileContent = loadFileContentsFromData(`${input.file}.html`)

  if (fileContent == null) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Content not set!',
    })
  }

  setHeader(event, 'Content-Type', 'text/html')
  return fileContent
})

import { readFileSync } from 'node:fs'
import path from 'node:path'

// Reads a file from the runtime `data/` directory (mountable outside the Docker
// container). Returns null when the file is absent so callers can 404 cleanly.
export const loadFileContentsFromData = (fileName: string): string | null => {
  const filePath = path.resolve(process.cwd(), 'data', fileName)
  try {
    return readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

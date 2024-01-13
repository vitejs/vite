import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export function getCodeHash(code: string): string {
  return createHash('sha1').update(code).digest('hex')
}

export function tryStatSync(file: string): fs.Stats | undefined {
  try {
    return fs.statSync(file, { throwIfNoEntry: false })
  } catch {
    // Ignore errors
  }
}

export function lookupFile(
  dir: string,
  fileNames: string[],
): string | undefined {
  while (dir) {
    for (const fileName of fileNames) {
      const fullPath = path.join(dir, fileName)
      if (tryStatSync(fullPath)?.isFile()) return fullPath
    }
    const parentDir = path.dirname(dir)
    if (parentDir === dir) return

    dir = parentDir
  }
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value != null
}

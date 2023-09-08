import fs from 'node:fs'
import colors from 'picocolors'
import { debugLog } from './debug.js'
import type { CacheManifest } from './types.js'

export interface ReadOptions {
  key: string
  manifest: CacheManifest
  patchedDuringCurrentSession: Set<string>
}

export async function read({
  key,
  manifest,
  patchedDuringCurrentSession,
}: ReadOptions): Promise<{
  code: string
  map?: any
} | null> {
  const entry = manifest.modules[key]
  if (!entry) {
    return null
  }

  if (patchedDuringCurrentSession.has(key)) {
    return null
  }

  try {
    debugLog(`read ${key} from ${entry.fileCode}`)
    const code = await fs.promises.readFile(entry.fileCode, 'utf8')
    const map = entry.fileMap
      ? JSON.parse(await fs.promises.readFile(entry.fileMap, 'utf8'))
      : undefined

    return {
      code,
      map,
    }
  } catch (e: any) {
    console.warn(
      colors.yellow(
        `Failed to read persistent cache entry '${key}' (${entry.file}): ${e.message}`,
      ),
    )
    return null
  }
}

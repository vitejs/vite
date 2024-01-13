import fs from 'node:fs'
import path from 'node:path'
import colors from 'picocolors'
import type { CacheManifest, ManifestManager } from './types.js'
import { debugLog } from './debug.js'

export async function useCacheManifest(
  resolvedCacheDir: string,
  cacheVersion: string,
): Promise<ManifestManager> {
  const manifestPath = path.join(resolvedCacheDir, 'manifest.json')
  let manifest: CacheManifest | null = null
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      if (manifest && manifest.version !== cacheVersion) {
        // Bust cache if version changed
        console.log(
          `Clearing persistent cache (${cacheVersion} from ${manifest.version})...`,
        )
        try {
          // Empty the directory
          const files = await fs.promises.readdir(resolvedCacheDir)
          await Promise.all(
            files.map((file) =>
              fs.promises.unlink(path.join(resolvedCacheDir, file)),
            ),
          )
          console.info(`Deleted ${files.length} files.`)
        } catch (e: any) {
          console.warn(
            colors.yellow(
              `Failed to empty persistent cache directory '${resolvedCacheDir}': ${e.message}`,
            ),
          )
        }
        manifest = null
      }
    } catch (e: any) {
      console.warn(
        colors.yellow(
          `Failed to load persistent cache manifest '${manifestPath}': ${e.message}`,
        ),
      )
    }
  }
  const resolvedManifest: CacheManifest = manifest ?? {
    version: cacheVersion,
    modules: {},
    files: {},
  }

  // Manifest write queue

  let isManifestWriteQueued = false
  let isManifestWriting = false
  let manifestWriteTimer: any = null

  function queueManifestWrite() {
    if (isManifestWriteQueued) {
      return
    }
    isManifestWriteQueued = true
    if (isManifestWriting) {
      return
    }

    writeManifest()
  }

  function writeManifest() {
    clearTimeout(manifestWriteTimer)
    manifestWriteTimer = setTimeout(async () => {
      isManifestWriting = true
      try {
        await fs.promises.writeFile(
          manifestPath,
          JSON.stringify(resolvedManifest, null, 2),
        )
        debugLog(`Persistent cache manifest saved`)
      } catch (e: any) {
        console.warn(
          colors.yellow(
            `Failed to write persistent cache manifest '${manifestPath}': ${e.message}`,
          ),
        )
      }
      isManifestWriting = false

      if (isManifestWriteQueued) {
        isManifestWriteQueued = false
        writeManifest()
      }
    }, 1000)
  }

  return {
    manifest: resolvedManifest,
    queueManifestWrite,
  }
}

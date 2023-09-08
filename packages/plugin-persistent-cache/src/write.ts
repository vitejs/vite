import path from 'node:path'
import fs from 'node:fs'
import type { ModuleNode } from 'vite'
import colors from 'picocolors'
import { debugLog } from './debug.js'
import type {
  CacheEntry,
  DepsMetadataManager,
  ManifestManager,
  ResolvedOptions,
} from './types.js'
import { isDefined } from './utils.js'

export interface WriteOptions {
  data: {
    cacheKey: string
    id: string
    url: string | undefined
    mod?: ModuleNode | null
    ssr: boolean
    file: string
    code: string
    map?: any
  }
  resolvedOptions: ResolvedOptions
  manifestManager: ManifestManager
  depsMetadataManager: DepsMetadataManager
  patchedDuringCurrentSession: Set<string>
}

export async function write({
  data,
  resolvedOptions,
  manifestManager,
  depsMetadataManager,
  patchedDuringCurrentSession,
}: WriteOptions): Promise<void> {
  try {
    const fileCode = path.resolve(
      resolvedOptions.cacheDir,
      'c-' + data.cacheKey,
    )
    const fileMap = data.map ? fileCode + '-map' : undefined
    debugLog(`write ${data.cacheKey} to ${fileCode}`)

    let wasPatched = false

    let code = data.code

    const depsMetadata = depsMetadataManager.getDepsMetadata()

    // Rewrite optimized deps imports using the final browserHash
    // The version query will change after first time they are optimized
    // (They are not updated during first run to keep urls stable)
    if (depsMetadata && data.mod) {
      for (const m of data.mod.importedModules) {
        if (m.file) {
          for (const depId in depsMetadata.optimized) {
            const dep = depsMetadata.optimized[depId]
            if (dep.file === m.file) {
              code = code.replaceAll(
                m.url,
                m.url.replace(/v=\w+/, `v=${depsMetadata.browserHash}`),
              )
              wasPatched = true
              break
            }
          }
        }
      }
    }

    // Create cache entry

    const entry: CacheEntry = {
      id: data.id,
      url: data.url,
      file: data.file,
      fileCode,
      fileMap,
    }

    if (data.mod) {
      const importedModules = Array.from(data.mod.importedModules)
        .filter((m) => !!m.id && !!m.file)
        .map((m) => ({
          id: m.id!,
          url: m.url,
          file: m.file!,
        }))
      const importedBindings: any = {}
      if (data.mod.importedBindings) {
        for (const k in data.mod.importedBindings) {
          const s = data.mod.importedBindings.get(k)
          if (s) {
            importedBindings[k] = Array.from(s)
          }
        }
      }

      const acceptedHmrDeps = Array.from(data.mod.acceptedHmrDeps)
        .map((m) => m.url)
        .filter(isDefined)

      const acceptedHmrExports = data.mod.acceptedHmrExports
        ? (Array.from(data.mod.acceptedHmrExports).filter(Boolean) as string[])
        : []

      const isSelfAccepting = data.mod.isSelfAccepting

      entry.fullData = {
        importedModules,
        importedBindings,
        acceptedHmrDeps,
        acceptedHmrExports,
        isSelfAccepting,
        ssr: data.ssr,
      }
    }

    manifestManager.manifest.modules[data.cacheKey] = entry

    manifestManager.queueManifestWrite()

    // Write files

    if (wasPatched) {
      patchedDuringCurrentSession.add(data.cacheKey)
    } else {
      patchedDuringCurrentSession.delete(data.cacheKey)
    }

    await fs.promises.writeFile(fileCode, code, 'utf8')
    if (data.map && fileMap) {
      await fs.promises.writeFile(fileMap, JSON.stringify(data.map), 'utf8')
    }
  } catch (e: any) {
    console.warn(
      colors.yellow(
        `Failed to write persistent cache entry '${data.cacheKey}' (${data.file}): ${e.message}`,
      ),
    )
  }
}

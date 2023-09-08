import fs from 'node:fs'
import type { DepOptimizationMetadata } from 'vite'
import type { CacheManifest, DepsMetadataManager } from './types.js'
import { debugLog } from './debug.js'

interface UseDepsMetadataOptions {
  manifest: CacheManifest
  patchedDuringCurrentSession: Set<string>
}

export function useDepsMetadata({
  manifest,
  patchedDuringCurrentSession,
}: UseDepsMetadataOptions): DepsMetadataManager {
  // Optimized deps

  let depsMetadata: DepOptimizationMetadata | null = null

  async function updateDepsMetadata(metadata: DepOptimizationMetadata) {
    depsMetadata = metadata

    // Update existing cache files
    await Promise.all(
      Object.keys(manifest.modules).map(async (key) => {
        const entry = manifest.modules[key]
        if (entry?.fullData) {
          // Gather code changes
          const optimizedDeps: [string, string][] = []
          for (const m of entry.fullData.importedModules) {
            for (const depId in metadata.optimized) {
              const dep = metadata.optimized[depId]
              if (dep.file === m.file) {
                optimizedDeps.push([
                  m.url,
                  m.url.replace(/v=\w+/, `v=${metadata.browserHash}`),
                ])
                break
              }
            }
          }
          // Apply code changes
          if (optimizedDeps.length) {
            let code = await fs.promises.readFile(entry.fileCode, 'utf8')
            patchedDuringCurrentSession.add(key)
            for (const [from, to] of optimizedDeps) {
              code = code.replaceAll(from, to)
            }
            await fs.promises.writeFile(entry.fileCode, code, 'utf8')
            debugLog(
              `Updated ${
                entry.id
              } with new optimized deps imports: ${optimizedDeps
                .map(([from, to]) => `${from} -> ${to}`)
                .join(', ')}`,
            )
          }
        }
      }),
    )
  }

  return {
    getDepsMetadata: () => depsMetadata,
    updateDepsMetadata,
  }
}

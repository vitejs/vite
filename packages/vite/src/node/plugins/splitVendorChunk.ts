import type { Plugin } from '../plugin'
import type { OutputOptions, GetManualChunk, GetModuleInfo } from 'rollup'
import { isCSSRequest } from './css'

// Use splitVendorChunkPlugin() to get the same manualChunks strategy as Vite 2.7
// We don't recommend using this strategy as a general solution moving forward

// splitVendorChunk is a simple index/vendor strategy that was used in Vite
// until v2.8. It is exposed to let people continue to use it in case it was
// working well for their setups.
// The cache needs to be reset on buildStart for watch mode to work correctly
// Don't use this manualChunks strategy for ssr, lib mode, and 'umd' or 'iife'

export class SplitVendorChunkCache {
  cache: Map<string, boolean>
  constructor() {
    this.cache = new Map<string, boolean>()
  }
  reset() {
    this.cache = new Map<string, boolean>()
  }
}

export function splitVendorChunk({
  cache = new SplitVendorChunkCache()
}): GetManualChunk {
  return (id, { getModuleInfo }) => {
    if (
      id.includes('node_modules') &&
      !isCSSRequest(id) &&
      staticImportedByEntry(id, getModuleInfo, cache.cache)
    ) {
      return 'vendor'
    }
  }
}

function staticImportedByEntry(
  id: string,
  getModuleInfo: GetModuleInfo,
  cache: Map<string, boolean>,
  importStack: string[] = []
): boolean {
  if (cache.has(id)) {
    return cache.get(id) as boolean
  }
  if (importStack.includes(id)) {
    // circular deps!
    cache.set(id, false)
    return false
  }
  const mod = getModuleInfo(id)
  if (!mod) {
    cache.set(id, false)
    return false
  }

  if (mod.isEntry) {
    cache.set(id, true)
    return true
  }
  const someImporterIs = mod.importers.some((importer) =>
    staticImportedByEntry(
      importer,
      getModuleInfo,
      cache,
      importStack.concat(id)
    )
  )
  cache.set(id, someImporterIs)
  return someImporterIs
}

export function splitVendorChunkPlugin(): Plugin {
  const cache = new SplitVendorChunkCache()
  return {
    name: 'vite:split-vendor-chunk',
    config(config) {
      const build = config.build ?? {}
      const format = (build.rollupOptions?.output as OutputOptions)?.format
      if (!build.ssr && !build.lib && format !== 'umd' && format !== 'iife') {
        return {
          build: {
            rollupOptions: {
              manualChunks: splitVendorChunk({ cache })
            }
          }
        }
      }
    },
    buildStart() {
      cache.reset()
    }
  }
}

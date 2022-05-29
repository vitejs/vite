import type {
  GetManualChunk,
  GetManualChunkApi,
  GetModuleInfo,
  OutputOptions
} from 'rollup'
import type { UserConfig } from '../../node'
import type { Plugin } from '../plugin'

// This file will be built for both ESM and CJS. Avoid relying on other modules as possible.
const cssLangs = `\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)`
const cssLangRE = new RegExp(cssLangs)
export const isCSSRequest = (request: string): boolean =>
  cssLangRE.test(request)

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
  reset(): void {
    this.cache = new Map<string, boolean>()
  }
}

export function splitVendorChunk(
  options: { cache?: SplitVendorChunkCache } = {}
): GetManualChunk {
  const cache = options.cache ?? new SplitVendorChunkCache()
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
  const caches: SplitVendorChunkCache[] = []
  function createSplitVendorChunk(output: OutputOptions, config: UserConfig) {
    const cache = new SplitVendorChunkCache()
    caches.push(cache)
    const build = config.build ?? {}
    const format = output?.format
    if (!build.ssr && !build.lib && format !== 'umd' && format !== 'iife') {
      return splitVendorChunk({ cache })
    }
  }
  return {
    name: 'vite:split-vendor-chunk',
    config(config) {
      let outputs = config?.build?.rollupOptions?.output
      if (outputs) {
        outputs = Array.isArray(outputs) ? outputs : [outputs]
        for (const output of outputs) {
          const viteManualChunks = createSplitVendorChunk(output, config)
          if (viteManualChunks) {
            if (output.manualChunks) {
              if (typeof output.manualChunks === 'function') {
                const userManualChunks = output.manualChunks
                output.manualChunks = (id: string, api: GetManualChunkApi) => {
                  return userManualChunks(id, api) ?? viteManualChunks(id, api)
                }
              }
              // else, leave the object form of manualChunks untouched, as
              // we can't safely replicate rollup handling.
            } else {
              output.manualChunks = viteManualChunks
            }
          }
        }
      } else {
        return {
          build: {
            rollupOptions: {
              output: {
                manualChunks: createSplitVendorChunk({}, config)
              }
            }
          }
        }
      }
    },
    buildStart() {
      caches.forEach((cache) => cache.reset())
    }
  }
}

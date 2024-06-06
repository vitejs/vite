import type {
  GetManualChunk,
  GetModuleInfo,
  ManualChunkMeta,
  OutputOptions,
} from 'rollup'
import { arraify, isInNodeModules } from '../utils'
import type { UserConfig } from '../../node'
import type { Plugin } from '../plugin'

// This file will be built for both ESM and CJS. Avoid relying on other modules as possible.

// copy from constants.ts
const CSS_LANGS_RE =
  // eslint-disable-next-line regexp/no-unused-capturing-group
  /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/
export const isCSSRequest = (request: string): boolean =>
  CSS_LANGS_RE.test(request)

// Use splitVendorChunkPlugin() to get the same manualChunks strategy as Vite 2.7
// We don't recommend using this strategy as a general solution moving forward

// splitVendorChunk is a simple index/vendor strategy that was used in Vite
// until v2.8. It is exposed to let people continue to use it in case it was
// working well for their setups.
// The cache needs to be reset on buildStart for watch mode to work correctly
// Don't use this manualChunks strategy for ssr, lib mode, and 'umd' or 'iife'

/**
 * @deprecated use build.rollupOptions.output.manualChunks or framework specific configuration
 */
export class SplitVendorChunkCache {
  cache: Map<string, boolean>
  constructor() {
    this.cache = new Map<string, boolean>()
  }
  reset(): void {
    this.cache = new Map<string, boolean>()
  }
}

/**
 * @deprecated use build.rollupOptions.output.manualChunks or framework specific configuration
 */
export function splitVendorChunk(
  options: { cache?: SplitVendorChunkCache } = {},
): GetManualChunk {
  const cache = options.cache ?? new SplitVendorChunkCache()
  return (id, { getModuleInfo }) => {
    if (
      isInNodeModules(id) &&
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
  importStack: string[] = [],
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
      importStack.concat(id),
    ),
  )
  cache.set(id, someImporterIs)
  return someImporterIs
}

/**
 * @deprecated use build.rollupOptions.output.manualChunks or framework specific configuration
 */
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
        outputs = arraify(outputs)
        for (const output of outputs) {
          const viteManualChunks = createSplitVendorChunk(output, config)
          if (viteManualChunks) {
            if (output.manualChunks) {
              if (typeof output.manualChunks === 'function') {
                const userManualChunks = output.manualChunks
                output.manualChunks = (id: string, api: ManualChunkMeta) => {
                  return userManualChunks(id, api) ?? viteManualChunks(id, api)
                }
              } else {
                // else, leave the object form of manualChunks untouched, as
                // we can't safely replicate rollup handling.
                // eslint-disable-next-line no-console
                console.warn(
                  "(!) the `splitVendorChunk` plugin doesn't have any effect when using the object form of `build.rollupOptions.output.manualChunks`. Consider using the function form instead.",
                )
              }
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
                manualChunks: createSplitVendorChunk({}, config),
              },
            },
          },
        }
      }
    },
    buildStart() {
      caches.forEach((cache) => cache.reset())
    },
  }
}

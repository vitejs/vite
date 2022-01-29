// @ts-check
const cssLangs = `\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)`
const cssLangRE = new RegExp(cssLangs)
/**
 * Internal CSS Check from vite/src/node/plugins/css.ts
 * @param {string} request
 */
const isCSSRequest = (request) => cssLangRE.test(request)

// Use splitVendorChunkPlugin() to get the same manualChunks strategy as Vite 2.7
// We don't recommend using this strategy as a general solution moving forward

// splitVendorChunk is a simple index/vendor strategy that was used in Vite
// until v2.8. It is exposed to let people continue to use it in case it was
// working well for their setups.
// The cache needs to be reset on buildStart for watch mode to work correctly
// Don't use this manualChunks strategy for ssr, lib mode, and 'umd' or 'iife'

class SplitVendorCache {
  cache
  constructor() {
    this.cache = new Map()
  }
  reset() {
    this.cache = new Map()
  }
}

/**
 * manualChunk strategy splitting in index and vendor chunks
 * @param {{ cache?: SplitVendorCache }} options
 * @returns {import('rollup').GetManualChunk}
 */
function splitVendor(options = {}) {
  const cache = options.cache ?? new SplitVendorCache()
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

/**
 * Find if a module has been statically imported by an entry
 * @param {string} id
 * @param {import('rollup').GetModuleInfo} getModuleInfo
 * @param {Map<string, boolean>} cache
 * @param {string[]} importStack
 * @returns {boolean}
 */
function staticImportedByEntry(id, getModuleInfo, cache, importStack = []) {
  if (cache.has(id)) {
    return cache.get(id)
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

/**
 * Implements Vite 2.7 chunking strategy
 * @returns {import('vite').Plugin}
 */
function splitVendorPlugin() {
  /**
   * @type {SplitVendorCache[]}
   */
  const caches = []
  /**
   * @param {import('rollup').OutputOptions} output
   * @param {import('vite').UserConfig} config
   */
  function createSplitVendor(output, config) {
    const cache = new SplitVendorCache()
    caches.push(cache)
    const build = config.build ?? {}
    const format = output?.format
    if (!build.ssr && !build.lib && format !== 'umd' && format !== 'iife') {
      return splitVendor({ cache })
    }
  }
  return {
    name: 'vite:split-vendor-chunk',
    config(config) {
      let outputs = config?.build?.rollupOptions?.output
      if (outputs) {
        outputs = Array.isArray(outputs) ? outputs : [outputs]
        for (const output of outputs) {
          output.manualChunks = createSplitVendor(output, config)
        }
      } else {
        return {
          build: {
            rollupOptions: {
              manualChunks: createSplitVendor({}, config)
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

module.exports = { splitVendorPlugin, splitVendor, SplitVendorCache }

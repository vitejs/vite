import path from 'node:path'
import MagicString from 'magic-string'
import type { EmittedAsset, OutputChunk, RollupCache } from 'rollup'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import type { ViteDevServer } from '../server'
import { ENV_ENTRY, ENV_PUBLIC_PATH } from '../constants'
import {
  cleanUrl,
  createDebugger,
  getHash,
  injectQuery,
  normalizePath,
  parseRequest
} from '../utils'
import {
  createToImportMetaURLBasedRelativeRuntime,
  onRollupWarning,
  toOutputFilePathInJS
} from '../build'
import { getDepsOptimizer } from '../optimizer'

interface WorkerCache {
  // rollup cache avoid rollup analysis the same file multi-times
  cache: RollupCache

  // save worker all emit chunk avoid rollup make the same asset unique update the filename.
  assets: Map<string, EmittedAsset>

  // save worker bundled file id to avoid repeated execution of bundles
  // <input_filename, fileName>
  bundle: Map<string, string>

  // use to replace the worker asset flag to truth path
  // <hash, fileName>
  fileNameHash: Map<string, string>
}

const debug = createDebugger('vite:worker')
export type WorkerType = 'classic' | 'module' | 'ignore'
const workerAssetUrlRE = /__VITE_WORKER_ASSET__([a-z\d]{8})__/g
const WORKER_FILE_ID = 'worker_file'
const WORKER_PREFIX = '/@worker/'
const VOLUME_RE = /^[A-Z]:/i
const workerCache = new WeakMap<ResolvedConfig, WorkerCache>()

export function isWorkerRequest(id: string): boolean {
  const query = parseRequest(id)
  if (query && query[WORKER_FILE_ID] != null) {
    return true
  }
  return false
}

function mergeRollupCache(o?: RollupCache, n?: RollupCache): RollupCache {
  return {
    modules: (o?.modules || []).concat(n?.modules || []),
    plugins: Object.assign({}, o?.plugins, n?.plugins)
  }
}

function workerPathFromUrl(url: string): string {
  const id = cleanUrl(url)
  const fsPath = normalizePath(
    id.startsWith(WORKER_PREFIX) ? id.slice(WORKER_PREFIX.length) : id
  )
  return fsPath.startsWith('/') || fsPath.match(VOLUME_RE)
    ? fsPath
    : `/${fsPath}`
}

async function bundleWorkerEntry(
  config: ResolvedConfig,
  id: string,
  query: Record<string, string> | null
): Promise<EmittedAsset> {
  const workerMap = workerCache.get(config.mainConfig || config)!
  if (workerMap.bundle.get(id)) {
    const outputChunk = workerMap.assets.get(id)!
    return outputChunk
  }
  // bundle the file as entry to support imports
  const isBuild = config.command === 'build'
  const { rollup } = await import('rollup')
  const { plugins, rollupOptions, format } = config.worker
  const cleanInput = cleanUrl(id)
  const relativeDirPath = path.dirname(path.relative(config.root, cleanInput))
  const bundle = await rollup({
    ...rollupOptions,
    cache: workerMap.cache,
    input: cleanInput,
    plugins,
    onwarn(warning, warn) {
      onRollupWarning(warning, warn, config)
    },
    preserveEntrySignatures: false
  }).catch((err) => {
    throw err
  })

  workerMap.cache = mergeRollupCache(workerMap.cache, bundle.cache)
  let chunk: OutputChunk
  try {
    const workerOutputConfig = config.worker.rollupOptions.output
    const workerConfig = workerOutputConfig
      ? Array.isArray(workerOutputConfig)
        ? workerOutputConfig[0] || {}
        : workerOutputConfig
      : {}
    const {
      output: [outputChunk, ...outputChunks]
    } = await bundle.generate({
      entryFileNames: path.posix.join(
        config.build.assetsDir,
        '[name].[hash].js'
      ),
      chunkFileNames: path.posix.join(
        config.build.assetsDir,
        '[name].[hash].js'
      ),
      assetFileNames: path.posix.join(
        config.build.assetsDir,
        '[name].[hash].[ext]'
      ),
      ...workerConfig,
      format,
      sourcemap: config.build.sourcemap,
      ...(!isBuild
        ? {
            entryFileNames: path.join(relativeDirPath, '[name].js'),
            chunkFileNames: path.join(relativeDirPath, '[name].js'),
            assetFileNames: path.join(relativeDirPath, '[name].[ext]')
          }
        : {})
    })
    chunk = outputChunk
    outputChunks.forEach((outputChunk) => {
      if (outputChunk.type === 'asset') {
        workerMap.assets.set(outputChunk.fileName, outputChunk)
      } else if (outputChunk.type === 'chunk') {
        workerMap.assets.set(outputChunk.fileName, {
          fileName: outputChunk.fileName,
          source: outputChunk.code,
          type: 'asset'
        })
      }
    })
  } finally {
    await bundle.close()
  }

  workerMap.assets.set(id, {
    fileName: chunk.fileName,
    source: chunk.code,
    type: 'asset'
  })
  workerMap.bundle.set(id, chunk.fileName)

  return emitSourcemapForWorkerEntry(config, query, chunk)
}

function emitSourcemapForWorkerEntry(
  config: ResolvedConfig,
  query: Record<string, string> | null,
  chunk: OutputChunk
): EmittedAsset {
  const { map: sourcemap } = chunk

  if (sourcemap) {
    if (config.build.sourcemap === 'inline') {
      // Manually add the sourcemap to the code if configured for inline sourcemaps.
      // TODO: Remove when https://github.com/rollup/rollup/issues/3913 is resolved
      // Currently seems that it won't be resolved until Rollup 3
      const dataUrl = sourcemap.toUrl()
      chunk.code += `//# sourceMappingURL=${dataUrl}`
    } else if (
      config.build.sourcemap === 'hidden' ||
      config.build.sourcemap === true
    ) {
      const data = sourcemap.toString()
      const mapFileName = chunk.fileName + '.map'
      const workerMap = workerCache.get(config.mainConfig || config)!

      workerMap.assets.set(mapFileName, {
        fileName: mapFileName,
        type: 'asset',
        source: data
      })

      // Emit the comment that tells the JS debugger where it can find the
      // sourcemap file.
      // 'hidden' causes the sourcemap file to be created but
      // the comment in the file to be omitted.
      if (config.build.sourcemap === true) {
        // inline web workers need to use the full sourcemap path
        // non-inline web workers can use a relative path
        const sourceMapUrl =
          query?.inline != null
            ? mapFileName
            : path.relative(config.build.assetsDir, mapFileName)
        chunk.code += `//# sourceMappingURL=${sourceMapUrl}`
      }
    }
  }

  return {
    fileName: chunk.fileName,
    source: chunk.code,
    type: 'asset'
  }
}

function encodeWorkerAssetFileName(
  fileName: string,
  workerCache: WorkerCache
): string {
  const { fileNameHash } = workerCache
  const hash = getHash(fileName)
  if (!fileNameHash.get(hash)) {
    fileNameHash.set(hash, fileName)
  }
  return `__VITE_WORKER_ASSET__${hash}__`
}

export async function workerFileToUrl(
  config: ResolvedConfig,
  id: string,
  query: Record<string, string> | null,
  workerType: WorkerType
): Promise<string> {
  if (config.command === 'serve') {
    let url = path.posix.join(WORKER_PREFIX + cleanUrl(id))
    url = config.server?.origin ?? '' + config.base + url.replace(/^\//, '')
    url = injectQuery(url, WORKER_FILE_ID)
    url = injectQuery(url, `type=${workerType}`)
    return url
  } else {
    const workerMap = workerCache.get(config.mainConfig || config)!
    const outputChunk = await bundleWorkerEntry(config, id, query)
    return encodeWorkerAssetFileName(outputChunk.fileName!, workerMap)
  }
}

export function webWorkerPlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'
  let server: ViteDevServer
  const isWorker = config.isWorker

  return {
    name: 'vite:worker',

    configureServer(_server) {
      server = _server
    },

    async buildStart() {
      if (isWorker) {
        return
      }
      workerCache.set(config, {
        cache: {
          modules: []
        },
        assets: new Map(),
        bundle: new Map(),
        fileNameHash: new Map()
      })
    },

    handleHotUpdate({ file, modules, server }) {
      const workerMap = workerCache.get(config.mainConfig || config)!
      workerMap.bundle.delete(file)
      server.moduleGraph
        .getModulesByFile(path.join(WORKER_PREFIX, file))
        ?.forEach((m) => {
          modules.push(m)
        })
      return modules
    },

    resolveId(id, importer) {
      // resolve worker virtual module (/@worker/*) deps named
      if (importer && importer.startsWith(WORKER_PREFIX)) {
        const res = path.join(path.dirname(cleanUrl(importer)), id)
        debug('[resolveId]', id, '->', res)
        return res
      }
    },

    async load(id) {
      const query = parseRequest(id)
      if (query && (query.worker ?? query.sharedworker) != null) {
        if (isWorker) {
          // bundle nested worker
          const input = workerPathFromUrl(id)
          debug('[bundle nested worker]', id)
          const outputChunk = await bundleWorkerEntry(config, input, query)
          return outputChunk.source as string
        }
        // will transform by worker wrap
        return ''
      }
      // /@worker/*
      if (id.startsWith(WORKER_PREFIX)) {
        debug('[virtual module]', id)
        const input = workerPathFromUrl(id)
        const workerMap = workerCache.get(config.mainConfig || config)!
        if (query && query[WORKER_FILE_ID] != null) {
          const outputChunk = await bundleWorkerEntry(config, input, query)
          // if import worker by worker constructor will have query.type
          // other type will be import worker by esm
          const workerType = query!['type']! as WorkerType
          let injectEnv!: string
          if (workerType === 'classic') {
            injectEnv = `importScripts('${ENV_PUBLIC_PATH}');\n`
          } else if (workerType === 'module') {
            injectEnv = `import '${ENV_PUBLIC_PATH}';\n`
          } else if (workerType === 'ignore') {
            if (isBuild) {
              injectEnv = ''
            } else if (server) {
              // dynamic worker type we can't know how import the env
              // so we copy /@vite/env code of server transform result into file header
              const { moduleGraph } = server
              const module = moduleGraph.getModuleById(ENV_ENTRY)
              injectEnv = module?.transformResult?.code || ''
            }
          }
          return injectEnv + outputChunk.source
        } else {
          return workerMap.assets.get(
            path.relative(WORKER_PREFIX + config.root, id)
          )?.source as string
        }
      }
    },

    async transform(raw, id, options) {
      const ssr = options?.ssr === true
      const query = parseRequest(id)
      if (
        query == null ||
        (query && (query.worker ?? query.sharedworker) == null)
      ) {
        return
      }
      // stringified url or `new URL(...)`
      const { format } = config.worker
      const workerConstructor =
        query.sharedworker != null ? 'SharedWorker' : 'Worker'
      const workerType = isBuild
        ? format === 'es'
          ? 'module'
          : 'classic'
        : 'module'
      const workerOptions = workerType === 'classic' ? '' : ',{type: "module"}'
      if (isBuild) {
        getDepsOptimizer(config, ssr)?.registerWorkersSource(id)
        if (query.inline != null) {
          const chunk = await bundleWorkerEntry(config, id, query)
          // inline as blob data url
          return {
            code: `const encodedJs = "${Buffer.from(chunk.source!).toString(
              'base64'
            )}";
            const blob = typeof window !== "undefined" && window.Blob && new Blob([atob(encodedJs)], { type: "text/javascript;charset=utf-8" });
            export default function WorkerWrapper() {
              const objURL = blob && (window.URL || window.webkitURL).createObjectURL(blob);
              try {
                return objURL ? new ${workerConstructor}(objURL) : new ${workerConstructor}("data:application/javascript;base64," + encodedJs${workerOptions});
              } finally {
                objURL && (window.URL || window.webkitURL).revokeObjectURL(objURL);
              }
            }`,

            // Empty sourcemap to suppress Rollup warning
            map: { mappings: '' }
          }
        }
      }
      const url = await workerFileToUrl(config, id, query, workerType)
      if (query.url != null) {
        return {
          code: `export default ${JSON.stringify(url)}`,
          map: { mappings: '' } // Empty sourcemap to suppress Rollup warning
        }
      }

      return {
        code: `export default function WorkerWrapper() {
          return new ${workerConstructor}(${JSON.stringify(
          url
        )}${workerOptions})
        }`,
        map: { mappings: '' } // Empty sourcemap to suppress Rollup warning
      }
    },

    renderChunk(code, chunk, outputOptions) {
      let s: MagicString
      const result = () => {
        return (
          s && {
            code: s.toString(),
            map: config.build.sourcemap ? s.generateMap({ hires: true }) : null
          }
        )
      }
      if (code.match(workerAssetUrlRE) || code.includes('import.meta.url')) {
        const toRelativeRuntime = createToImportMetaURLBasedRelativeRuntime(
          outputOptions.format
        )

        let match: RegExpExecArray | null
        s = new MagicString(code)

        // Replace "__VITE_WORKER_ASSET__5aa0ddc0__" using relative paths
        const workerMap = workerCache.get(config.mainConfig || config)!
        const { fileNameHash } = workerMap

        while ((match = workerAssetUrlRE.exec(code))) {
          const [full, hash] = match
          const filename = fileNameHash.get(hash)!
          const replacement = toOutputFilePathInJS(
            filename,
            'asset',
            chunk.fileName,
            'js',
            config,
            toRelativeRuntime
          )
          const replacementString =
            typeof replacement === 'string'
              ? JSON.stringify(replacement).slice(1, -1)
              : `"+${replacement.runtime}+"`
          s.update(match.index, match.index + full.length, replacementString)
        }
      }
      return result()
    },

    generateBundle(opts) {
      // @ts-ignore asset emits are skipped in legacy bundle
      if (opts.__vite_skip_asset_emit__ || isWorker) {
        return
      }
      const workerMap = workerCache.get(config)!
      workerMap.assets.forEach((asset) => {
        this.emitFile(asset)
        workerMap.assets.delete(asset.fileName!)
      })
    }
  }
}

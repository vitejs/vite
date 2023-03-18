import path from 'node:path'
import MagicString from 'magic-string'
import type { EmittedAsset, OutputChunk } from 'rollup'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import type { ViteDevServer } from '../server'
import { ENV_ENTRY, ENV_PUBLIC_PATH } from '../constants'
import { cleanUrl, getHash, injectQuery, parseRequest } from '../utils'
import {
  createToImportMetaURLBasedRelativeRuntime,
  onRollupWarning,
  toOutputFilePathInJS,
} from '../build'
import { getDepsOptimizer } from '../optimizer'
import { fileToUrl } from './asset'

interface WorkerCache {
  // save worker all emit chunk avoid rollup make the same asset unique.
  assets: Map<string, EmittedAsset>

  // worker bundle don't deps on any more worker runtime info an id only had a result.
  // save worker bundled file id to avoid repeated execution of bundles
  // <input_filename, fileName>
  bundle: Map<string, string>

  // <hash, fileName>
  fileNameHash: Map<string, string>
}

export type WorkerType = 'classic' | 'module' | 'ignore'

export const WORKER_FILE_ID = 'worker_file'
const workerCache = new WeakMap<ResolvedConfig, WorkerCache>()

export function isWorkerRequest(id: string): boolean {
  const query = parseRequest(id)
  if (query && query[WORKER_FILE_ID] != null) {
    return true
  }
  return false
}

function saveEmitWorkerAsset(
  config: ResolvedConfig,
  asset: EmittedAsset,
): void {
  const fileName = asset.fileName!
  const workerMap = workerCache.get(config.mainConfig || config)!
  workerMap.assets.set(fileName, asset)
}

// Ensure that only one rollup build is called at the same time to avoid
// leaking state in plugins between worker builds.
// TODO: Review if we can parallelize the bundling of workers.
const workerConfigSemaphore = new WeakMap<
  ResolvedConfig,
  Promise<OutputChunk>
>()
export async function bundleWorkerEntry(
  config: ResolvedConfig,
  id: string,
  query: Record<string, string> | null,
): Promise<OutputChunk> {
  const processing = workerConfigSemaphore.get(config)
  if (processing) {
    await processing
    return bundleWorkerEntry(config, id, query)
  }
  const promise = serialBundleWorkerEntry(config, id, query)
  workerConfigSemaphore.set(config, promise)
  promise.then(() => workerConfigSemaphore.delete(config))
  return promise
}

async function serialBundleWorkerEntry(
  config: ResolvedConfig,
  id: string,
  query: Record<string, string> | null,
): Promise<OutputChunk> {
  // bundle the file as entry to support imports
  const { rollup } = await import('rollup')
  const { plugins, rollupOptions, format } = config.worker
  const bundle = await rollup({
    ...rollupOptions,
    input: cleanUrl(id),
    plugins,
    onwarn(warning, warn) {
      onRollupWarning(warning, warn, config)
    },
    preserveEntrySignatures: false,
  })
  let chunk: OutputChunk
  try {
    const workerOutputConfig = config.worker.rollupOptions.output
    const workerConfig = workerOutputConfig
      ? Array.isArray(workerOutputConfig)
        ? workerOutputConfig[0] || {}
        : workerOutputConfig
      : {}
    const {
      output: [outputChunk, ...outputChunks],
    } = await bundle.generate({
      entryFileNames: path.posix.join(
        config.build.assetsDir,
        '[name]-[hash].js',
      ),
      chunkFileNames: path.posix.join(
        config.build.assetsDir,
        '[name]-[hash].js',
      ),
      assetFileNames: path.posix.join(
        config.build.assetsDir,
        '[name]-[hash].[ext]',
      ),
      ...workerConfig,
      format,
      sourcemap: config.build.sourcemap,
    })
    chunk = outputChunk
    outputChunks.forEach((outputChunk) => {
      if (outputChunk.type === 'asset') {
        saveEmitWorkerAsset(config, outputChunk)
      } else if (outputChunk.type === 'chunk') {
        saveEmitWorkerAsset(config, {
          fileName: outputChunk.fileName,
          source: outputChunk.code,
          type: 'asset',
        })
      }
    })
  } finally {
    await bundle.close()
  }
  return emitSourcemapForWorkerEntry(config, query, chunk)
}

function emitSourcemapForWorkerEntry(
  config: ResolvedConfig,
  query: Record<string, string> | null,
  chunk: OutputChunk,
): OutputChunk {
  const { map: sourcemap } = chunk

  if (sourcemap) {
    if (
      config.build.sourcemap === 'hidden' ||
      config.build.sourcemap === true
    ) {
      const data = sourcemap.toString()
      const mapFileName = chunk.fileName + '.map'
      saveEmitWorkerAsset(config, {
        fileName: mapFileName,
        type: 'asset',
        source: data,
      })
    }
  }

  return chunk
}

export const workerAssetUrlRE = /__VITE_WORKER_ASSET__([a-z\d]{8})__/g

function encodeWorkerAssetFileName(
  fileName: string,
  workerCache: WorkerCache,
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
): Promise<string> {
  const workerMap = workerCache.get(config.mainConfig || config)!
  let fileName = workerMap.bundle.get(id)
  if (!fileName) {
    const outputChunk = await bundleWorkerEntry(config, id, query)
    fileName = outputChunk.fileName
    saveEmitWorkerAsset(config, {
      fileName,
      source: outputChunk.code,
      type: 'asset',
    })
    workerMap.bundle.set(id, fileName)
  }
  return encodeWorkerAssetFileName(fileName, workerMap)
}

export function webWorkerPlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'
  let server: ViteDevServer
  const isWorker = config.isWorker

  const isWorkerQueryId = (id: string) => {
    const parsedQuery = parseRequest(id)
    if (
      parsedQuery &&
      (parsedQuery.worker ?? parsedQuery.sharedworker) != null
    ) {
      return true
    }

    return false
  }

  return {
    name: 'vite:worker',

    configureServer(_server) {
      server = _server
    },

    buildStart() {
      if (isWorker) {
        return
      }
      workerCache.set(config, {
        assets: new Map(),
        bundle: new Map(),
        fileNameHash: new Map(),
      })
    },

    load(id) {
      if (isBuild && isWorkerQueryId(id)) {
        return ''
      }
    },

    shouldTransformCachedModule({ id }) {
      if (isBuild && isWorkerQueryId(id) && config.build.watch) {
        return true
      }
      return false
    },

    async transform(raw, id, options) {
      const ssr = options?.ssr === true
      const query = parseRequest(id)
      if (query && query[WORKER_FILE_ID] != null) {
        // if import worker by worker constructor will have query.type
        // other type will be import worker by esm
        const workerType = query['type']! as WorkerType
        let injectEnv = ''

        if (workerType === 'classic') {
          injectEnv = `importScripts('${ENV_PUBLIC_PATH}')\n`
        } else if (workerType === 'module') {
          injectEnv = `import '${ENV_PUBLIC_PATH}'\n`
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
        return {
          code: injectEnv + raw,
        }
      }
      if (
        query == null ||
        (query && (query.worker ?? query.sharedworker) == null)
      ) {
        return
      }

      // stringified url or `new URL(...)`
      let url: string
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
          const encodedJs = `const encodedJs = "${Buffer.from(
            chunk.code,
          ).toString('base64')}";`

          const code =
            // Using blob URL for SharedWorker results in multiple instances of a same worker
            workerConstructor === 'Worker'
              ? `${encodedJs}
          const blob = typeof window !== "undefined" && window.Blob && new Blob([atob(encodedJs)], { type: "text/javascript;charset=utf-8" });
          export default function WorkerWrapper() {
            let objURL;
            try {
              objURL = blob && (window.URL || window.webkitURL).createObjectURL(blob);
              if (!objURL) throw ''
              return new ${workerConstructor}(objURL)
            } catch(e) {
              return new ${workerConstructor}("data:application/javascript;base64," + encodedJs${workerOptions});
            } finally {
              objURL && (window.URL || window.webkitURL).revokeObjectURL(objURL);
            }
          }`
              : `${encodedJs}
          export default function WorkerWrapper() {
            return new ${workerConstructor}("data:application/javascript;base64," + encodedJs${workerOptions});
          }
          `

          return {
            code,
            // Empty sourcemap to suppress Rollup warning
            map: { mappings: '' },
          }
        } else {
          url = await workerFileToUrl(config, id, query)
        }
      } else {
        url = await fileToUrl(cleanUrl(id), config, this)
        url = injectQuery(url, WORKER_FILE_ID)
        url = injectQuery(url, `type=${workerType}`)
      }

      if (query.url != null) {
        return {
          code: `export default ${JSON.stringify(url)}`,
          map: { mappings: '' }, // Empty sourcemap to suppress Rollup warning
        }
      }

      return {
        code: `export default function WorkerWrapper() {
          return new ${workerConstructor}(${JSON.stringify(
          url,
        )}${workerOptions})
        }`,
        map: { mappings: '' }, // Empty sourcemap to suppress Rollup warning
      }
    },

    renderChunk(code, chunk, outputOptions) {
      let s: MagicString
      const result = () => {
        return (
          s && {
            code: s.toString(),
            map: config.build.sourcemap ? s.generateMap({ hires: true }) : null,
          }
        )
      }
      if (code.match(workerAssetUrlRE) || code.includes('import.meta.url')) {
        const toRelativeRuntime = createToImportMetaURLBasedRelativeRuntime(
          outputOptions.format,
        )

        let match: RegExpExecArray | null
        s = new MagicString(code)
        workerAssetUrlRE.lastIndex = 0

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
            toRelativeRuntime,
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
      // @ts-expect-error asset emits are skipped in legacy bundle
      if (opts.__vite_skip_asset_emit__ || isWorker) {
        return
      }
      const workerMap = workerCache.get(config)!
      workerMap.assets.forEach((asset) => {
        this.emitFile(asset)
        workerMap.assets.delete(asset.fileName!)
      })
    },
  }
}

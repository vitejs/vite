import path from 'path'
import MagicString from 'magic-string'
import type { EmittedAsset, OutputChunk } from 'rollup'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import type { ViteDevServer } from '../server'
import { ENV_ENTRY, ENV_PUBLIC_PATH } from '../constants'
import {
  cleanUrl,
  getHash,
  injectQuery,
  isRelativeBase,
  parseRequest
} from '../utils'
import { onRollupWarning } from '../build'
import { fileToUrl } from './asset'
import { registerWorkersSource } from './optimizedDeps'

interface WorkerCache {
  // save worker all emit chunk avoid rollup make the same asset unique.
  assets: Map<string, EmittedAsset>

  // worker bundle don't deps on any more worker runtime info an id only had an result.
  // save worker bundled file id to avoid repeated execution of bundles
  // <input_filename, fileName>
  bundle: Map<string, string>

  // <hash, fileName>
  fileNameHash: Map<string, string>
}

export type WorkerType = 'classic' | 'module' | 'ignore'

export const WORKER_FILE_ID = 'worker_file'
const workerCache = new WeakMap<ResolvedConfig, WorkerCache>()

function saveEmitWorkerAsset(
  config: ResolvedConfig,
  asset: EmittedAsset
): void {
  const fileName = asset.fileName!
  const workerMap = workerCache.get(config.mainConfig || config)!
  workerMap.assets.set(fileName, asset)
}

export async function bundleWorkerEntry(
  config: ResolvedConfig,
  id: string,
  query: Record<string, string> | null
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
    preserveEntrySignatures: false
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
      sourcemap: config.build.sourcemap
    })
    chunk = outputChunk
    outputChunks.forEach((outputChunk) => {
      if (outputChunk.type === 'asset') {
        saveEmitWorkerAsset(config, outputChunk)
      } else if (outputChunk.type === 'chunk') {
        saveEmitWorkerAsset(config, {
          fileName: outputChunk.fileName,
          source: outputChunk.code,
          type: 'asset'
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
  chunk: OutputChunk
): OutputChunk {
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
      saveEmitWorkerAsset(config, {
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

  return chunk
}

export const workerAssetUrlRE = /__VITE_WORKER_ASSET__([a-z\d]{8})__/g

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
  query: Record<string, string> | null
): Promise<string> {
  const workerMap = workerCache.get(config.mainConfig || config)!
  let fileName = workerMap.bundle.get(id)
  if (!fileName) {
    const outputChunk = await bundleWorkerEntry(config, id, query)
    fileName = outputChunk.fileName
    saveEmitWorkerAsset(config, {
      fileName,
      source: outputChunk.code,
      type: 'asset'
    })
    workerMap.bundle.set(id, fileName)
  }

  return isRelativeBase(config.base)
    ? encodeWorkerAssetFileName(fileName, workerMap)
    : config.base + fileName
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

    buildStart() {
      if (isWorker) {
        return
      }
      workerCache.set(config, {
        assets: new Map(),
        bundle: new Map(),
        fileNameHash: new Map()
      })
    },

    load(id) {
      if (isBuild) {
        const parsedQuery = parseRequest(id)
        if (
          parsedQuery &&
          (parsedQuery.worker ?? parsedQuery.sharedworker) != null
        ) {
          return ''
        }
      }
    },

    async transform(raw, id) {
      const query = parseRequest(id)
      if (query && query[WORKER_FILE_ID] != null) {
        // if import worker by worker constructor will had query.type
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
          code: injectEnv + raw
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
        registerWorkersSource(config, id)
        if (query.inline != null) {
          const chunk = await bundleWorkerEntry(config, id, query)
          // inline as blob data url
          return {
            code: `const encodedJs = "${Buffer.from(chunk.code).toString(
              'base64'
            )}";
            const blob = typeof window !== "undefined" && window.Blob && new Blob([atob(encodedJs)], { type: "text/javascript;charset=utf-8" });
            export default function WorkerWrapper() {
              const objURL = blob && (window.URL || window.webkitURL).createObjectURL(blob);
              try {
                return objURL ? new ${workerConstructor}(objURL${workerOptions}) : new ${workerConstructor}("data:application/javascript;base64," + encodedJs${workerOptions});
              } finally {
                objURL && (window.URL || window.webkitURL).revokeObjectURL(objURL);
              }
            }`,

            // Empty sourcemap to suppress Rollup warning
            map: { mappings: '' }
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

    renderChunk(code, chunk) {
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
        let match: RegExpExecArray | null
        s = new MagicString(code)

        // Replace "__VITE_WORKER_ASSET__5aa0ddc0__" using relative paths
        const workerMap = workerCache.get(config.mainConfig || config)!
        const { fileNameHash } = workerMap

        while ((match = workerAssetUrlRE.exec(code))) {
          const [full, hash] = match
          const filename = fileNameHash.get(hash)!
          let outputFilepath = path.posix.relative(
            path.dirname(chunk.fileName),
            filename
          )
          if (!outputFilepath.startsWith('.')) {
            outputFilepath = './' + outputFilepath
          }
          const replacement = JSON.stringify(outputFilepath).slice(1, -1)
          s.overwrite(match.index, match.index + full.length, replacement, {
            contentOnly: true
          })
        }

        // TODO: check if this should be removed
        if (config.isWorker) {
          s = s.replace('import.meta.url', 'self.location.href')
          return result()
        }
      }
      if (!isWorker) {
        const workerMap = workerCache.get(config)!
        workerMap.assets.forEach((asset) => {
          this.emitFile(asset)
          workerMap.assets.delete(asset.fileName!)
        })
      }
      return result()
    }
  }
}

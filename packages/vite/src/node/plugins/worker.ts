import path from 'path'
import type { EmittedAsset, OutputChunk, TransformPluginContext } from 'rollup'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { cleanUrl, injectQuery, parseRequest } from '../utils'
import { ENV_PUBLIC_PATH } from '../constants'
import { onRollupWarning } from '../build'
import { fileToUrl } from './asset'

interface WorkerCache {
  // save worker all emit chunk avoid rollup make the same asset unique.
  assets: Map<string, EmittedAsset>

  // worker bundle don't deps on any more worker runtime info an id only had an result.
  // save worker bundled file id to avoid repeated execution of bundles
  // <input_filename, hash>
  bundle: Map<string, string>
}

const WorkerFileId = 'worker_file'
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
  ctx: TransformPluginContext,
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
  return emitSourcemapForWorkerEntry(ctx, config, query, chunk)
}

function emitSourcemapForWorkerEntry(
  ctx: TransformPluginContext,
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

export async function workerFileToUrl(
  ctx: TransformPluginContext,
  config: ResolvedConfig,
  id: string,
  query: Record<string, string> | null
): Promise<string> {
  const workerMap = workerCache.get(config.mainConfig || config)!
  let fileName = workerMap.bundle.get(id)
  if (!fileName) {
    const outputChunk = await bundleWorkerEntry(ctx, config, id, query)
    fileName = outputChunk.fileName
    saveEmitWorkerAsset(config, {
      fileName,
      source: outputChunk.code,
      type: 'asset'
    })
    workerMap.bundle.set(id, fileName)
  }
  return config.base + fileName
}

export function webWorkerPlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'
  const isWorker = config.isWorker
  return {
    name: 'vite:worker',

    buildStart() {
      if (isWorker) {
        return
      }
      workerCache.set(config, {
        assets: new Map(),
        bundle: new Map()
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

    async transform(_, id) {
      const query = parseRequest(id)
      if (query && query[WorkerFileId] != null) {
        return {
          code: `import '${ENV_PUBLIC_PATH}'\n` + _
        }
      }
      if (
        query == null ||
        (query && (query.worker ?? query.sharedworker) == null)
      ) {
        return
      }

      let url: string
      if (isBuild) {
        if (query.inline != null) {
          const chunk = await bundleWorkerEntry(this, config, id, query)
          const { format } = config.worker
          const workerOptions = format === 'es' ? '{type: "module"}' : '{}'
          // inline as blob data url
          return {
            code: `const encodedJs = "${Buffer.from(chunk.code).toString(
              'base64'
            )}";
            const blob = typeof window !== "undefined" && window.Blob && new Blob([atob(encodedJs)], { type: "text/javascript;charset=utf-8" });
            export default function WorkerWrapper() {
              const objURL = blob && (window.URL || window.webkitURL).createObjectURL(blob);
              try {
                return objURL ? new Worker(objURL, ${workerOptions}) : new Worker("data:application/javascript;base64," + encodedJs, {type: "module"});
              } finally {
                objURL && (window.URL || window.webkitURL).revokeObjectURL(objURL);
              }
            }`,

            // Empty sourcemap to suppress Rollup warning
            map: { mappings: '' }
          }
        } else {
          url = await workerFileToUrl(this, config, id, query)
        }
      } else {
        url = await fileToUrl(cleanUrl(id), config, this)
        url = injectQuery(url, WorkerFileId)
      }

      const workerConstructor =
        query.sharedworker != null ? 'SharedWorker' : 'Worker'
      const workerOptions = { type: 'module' }

      return {
        code: `export default function WorkerWrapper() {
          return new ${workerConstructor}(${JSON.stringify(
          url
        )}, ${JSON.stringify(workerOptions, null, 2)})
        }`,
        map: { mappings: '' } // Empty sourcemap to suppress Rollup warning
      }
    },

    renderChunk(code) {
      if (config.isWorker && code.includes('import.meta.url')) {
        return code.replace('import.meta.url', 'self.location.href')
      }
      if (!isWorker) {
        const workerMap = workerCache.get(config)!
        workerMap.assets.forEach((asset) => {
          this.emitFile(asset)
          workerMap.assets.delete(asset.fileName!)
        })
      }
    }
  }
}

import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { fileToUrl, getAssetHash } from './asset'
import { cleanUrl, injectQuery, parseRequest } from '../utils'
import type Rollup from 'rollup'
import { ENV_PUBLIC_PATH } from '../constants'
import path from 'path'
import { onRollupWarning } from '../build'
import type { EmittedFile } from 'rollup'

interface WorkerCache {
  // save worker bundle emitted files avoid overwrites the same file.
  // <chunk_filename, hash>
  assets: Map<string, string>
  chunks: Map<string, string>
  // worker bundle don't deps on any more worker runtime info an id only had an result.
  // save worker bundled file id to avoid repeated execution of bundles
  // <filename, hash>
  bundle: Map<string, string>
  // nested worker bundle context don't had file what emitted by outside bundle
  // save the hash to id to rewrite truth id.
  // <hash, id>
  emitted: Map<string, string>
}

const WorkerFileId = 'worker_file'
const workerCache = new WeakMap<ResolvedConfig, WorkerCache>()

function emitWorkerFile(
  ctx: Rollup.TransformPluginContext,
  config: ResolvedConfig,
  asset: EmittedFile,
  type: 'assets' | 'chunks'
): string {
  const fileName = asset.fileName!
  const workerMap = workerCache.get(config)!

  if (workerMap[type].has(fileName)) {
    return workerMap[type].get(fileName)!
  }
  const hash = ctx.emitFile(asset)
  workerMap[type].set(fileName, hash)
  workerMap.emitted.set(hash, fileName)
  return hash
}

function emitWorkerAssets(
  ctx: Rollup.TransformPluginContext,
  config: ResolvedConfig,
  asset: EmittedFile
) {
  const { format } = config.worker
  return emitWorkerFile(
    ctx,
    config,
    asset,
    format === 'es' ? 'chunks' : 'assets'
  )
}

function emitWorkerChunks(
  ctx: Rollup.TransformPluginContext,
  config: ResolvedConfig,
  asset: EmittedFile
) {
  return emitWorkerFile(ctx, config, asset, 'chunks')
}

export async function bundleWorkerEntry(
  ctx: Rollup.TransformPluginContext,
  config: ResolvedConfig,
  id: string
): Promise<Buffer> {
  // bundle the file as entry to support imports
  const rollup = require('rollup') as typeof Rollup
  const { plugins, rollupOptions, format } = config.worker
  const bundle = await rollup.rollup({
    ...rollupOptions,
    input: cleanUrl(id),
    plugins,
    onwarn(warning, warn) {
      onRollupWarning(warning, warn, config)
    },
    preserveEntrySignatures: false
  })
  let code: string
  try {
    const {
      output: [outputCode, ...outputChunks]
    } = await bundle.generate({
      format,
      sourcemap: config.build.sourcemap
    })
    code = outputCode.code
    outputChunks.forEach((outputChunk) => {
      if (outputChunk.type === 'asset') {
        emitWorkerAssets(ctx, config, outputChunk)
      } else if (outputChunk.type === 'chunk') {
        emitWorkerChunks(ctx, config, {
          fileName: path.posix.join(
            config.build.assetsDir,
            outputChunk.fileName
          ),
          source: outputChunk.code,
          type: 'asset'
        })
      }
    })
  } finally {
    await bundle.close()
  }
  return Buffer.from(code)
}

export async function workerFileToUrl(
  ctx: Rollup.TransformPluginContext,
  config: ResolvedConfig,
  id: string
): Promise<string> {
  const workerMap = workerCache.get(config)!

  let hash = workerMap.bundle.get(id)
  if (hash) {
    // rewrite truth id, no need to replace by asset plugin
    return config.base + workerMap.emitted.get(hash)!
  }
  const code = await bundleWorkerEntry(ctx, config, id)
  const basename = path.parse(cleanUrl(id)).name
  const contentHash = getAssetHash(code)
  const fileName = path.posix.join(
    config.build.assetsDir,
    `${basename}.${contentHash}.js`
  )
  hash = emitWorkerAssets(ctx, config, {
    fileName,
    type: 'asset',
    source: code
  })
  workerMap.bundle.set(id, hash)
  return `__VITE_ASSET__${hash}__`
}

export function webWorkerPlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'
  const isWorker = config.isWorker

  return {
    name: 'vite:worker',

    buildStart() {
      workerCache.set(config, {
        assets: new Map(),
        chunks: new Map(),
        bundle: new Map(),
        emitted: new Map()
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
          const code = await bundleWorkerEntry(this, config, id)
          const { format } = config.worker
          const workerOptions = format === 'es' ? '{type: "module"}' : '{}'
          // inline as blob data url
          return `const encodedJs = "${code.toString('base64')}";
            const blob = typeof window !== "undefined" && window.Blob && new Blob([atob(encodedJs)], { type: "text/javascript;charset=utf-8" });
            export default function WorkerWrapper() {
              const objURL = blob && (window.URL || window.webkitURL).createObjectURL(blob);
              try {
                return objURL ? new Worker(objURL, ${workerOptions}) : new Worker("data:application/javascript;base64," + encodedJs, {type: "module"});
              } finally {
                objURL && (window.URL || window.webkitURL).revokeObjectURL(objURL);
              }
            }`
        } else {
          url = await workerFileToUrl(this, config, id)
        }
      } else {
        url = await fileToUrl(cleanUrl(id), config, this)
        url = injectQuery(url, WorkerFileId)
      }

      const workerConstructor =
        query.sharedworker != null ? 'SharedWorker' : 'Worker'
      const workerOptions = { type: 'module' }

      return `export default function WorkerWrapper() {
        return new ${workerConstructor}(${JSON.stringify(
        url
      )}, ${JSON.stringify(workerOptions, null, 2)})
      }`
    },

    renderChunk(code) {
      if (isWorker && code.includes('import.meta.url')) {
        return code.replace('import.meta.url', 'self.location.href')
      }
    }
  }
}

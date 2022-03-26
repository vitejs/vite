import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { fileToUrl, getAssetHash } from './asset'
import { cleanUrl, injectQuery, parseRequest } from '../utils'
import type Rollup from 'rollup'
import { ENV_PUBLIC_PATH } from '../constants'
import path from 'path'
import { onRollupWarning } from '../build'
import type { EmittedFile } from 'rollup'

const WorkerFileId = 'worker_file'
// <id, hash>
const workerEmittedAssets = new Map<string, string>()
const workerEmittedChunk = new Map<string, string>()
// <hash, id>
const workerEmittedFile = new Map<string, string>()

function emitWorker(
  ctx: Rollup.TransformPluginContext,
  asset: EmittedFile,
  map: Map<string, string>
): string {
  const fileName = asset.fileName!

  if (map.has(fileName)) {
    return map.get(fileName)!
  }
  const hash = ctx.emitFile(asset)
  map.set(fileName, hash)
  workerEmittedFile.set(hash, fileName)
  return hash
}

// catch output filename avoid overwrites the same file.
export function emitWorkerAssets(
  ctx: Rollup.TransformPluginContext,
  asset: EmittedFile
): string {
  return emitWorker(ctx, asset, workerEmittedAssets)
}

export function emitWorkerChunks(
  ctx: Rollup.TransformPluginContext,
  asset: EmittedFile
): string {
  return emitWorker(ctx, asset, workerEmittedChunk)
}

export function getWorkerAssetFilename(hash: string) {
  return workerEmittedFile.get(hash)
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
        emitWorkerAssets(ctx, outputChunk)
      } else if (outputChunk.type === 'chunk') {
        emitWorkerChunks(ctx, {
          fileName: `${config.build.assetsDir}/${outputChunk.fileName}`,
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

export function webWorkerPlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'

  return {
    name: 'vite:worker',

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
        const code = await bundleWorkerEntry(this, config, id)
        if (query.inline != null) {
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
          const basename = path.parse(cleanUrl(id)).name
          const contentHash = getAssetHash(code)
          const fileName = path.posix.join(
            config.build.assetsDir,
            `${basename}.${contentHash}.js`
          )
          url = `__VITE_ASSET__${emitWorkerChunks(this, {
            fileName,
            type: 'asset',
            source: code
          })}__`
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
    }
  }
}

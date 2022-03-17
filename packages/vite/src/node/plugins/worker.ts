import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { fileToUrl, getAssetHash } from './asset'
import { cleanUrl, injectQuery, parseRequest } from '../utils'
import type Rollup from 'rollup'
import { ENV_PUBLIC_PATH } from '../constants'
import path from 'path'
import { onRollupWarning } from '../build'

const WorkerFileId = 'worker_file'
export const inlineWorkerLoaderId = `vite/inline-worker-loader`

// run in client load inline worker
export function inlineWorkerLoader(
  workerConstructor: FunctionConstructor,
  workerOptions: any,
  encodedJs: string
) {
  const blob =
    // @ts-ignore
    typeof window !== 'undefined' &&
    // @ts-ignore
    window.Blob &&
    // @ts-ignore
    new Blob([atob(encodedJs)], { type: 'text/javascript;charset=utf-8' })
  // @ts-ignore
  const objURL = blob && (window.URL || window.webkitURL).createObjectURL(blob)
  try {
    return objURL
      ? new workerConstructor(objURL, workerOptions)
      : new workerConstructor(
          'data:application/javascript;base64,' + encodedJs,
          workerOptions
        )
  } finally {
    // revokeObjectURL in nextTick
    setTimeout(() => {
      // @ts-ignore
      objURL && (window.URL || window.webkitURL).revokeObjectURL(objURL)
    })
  }
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
        ctx.emitFile(outputChunk)
      }
      if (outputChunk.type === 'chunk') {
        ctx.emitFile({
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
  const { inlineLimit } = config.worker
  return {
    name: 'vite:worker',

    resolveId(id) {
      if (id === inlineWorkerLoaderId) {
        return id
      }
    },

    load(id) {
      if (id === inlineWorkerLoaderId) {
        return `export default ${inlineWorkerLoader.toString()}`
      }
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
      const workerConstructor =
        query.sharedworker != null ? 'SharedWorker' : 'Worker'
      if (isBuild) {
        const code = await bundleWorkerEntry(this, config, id)
        const inline = code.length < inlineLimit
        if (query.inline != null || inline) {
          const { format } = config.worker
          const workerOptions = format === 'es' ? '{type: "module"}' : '{}'
          // inline as blob data url
          return `import inlineWorkerLoader from "${inlineWorkerLoaderId}"\nexport default function() {return inlineWorkerLoader(${workerConstructor}, ${workerOptions}, "${code.toString(
            'base64'
          )}")}`
        } else {
          const basename = path.parse(cleanUrl(id)).name
          const contentHash = getAssetHash(code)
          const fileName = path.posix.join(
            config.build.assetsDir,
            `${basename}.${contentHash}.js`
          )
          url = `__VITE_ASSET__${this.emitFile({
            fileName,
            type: 'asset',
            source: code
          })}__`
        }
      } else {
        url = await fileToUrl(cleanUrl(id), config, this)
        url = injectQuery(url, WorkerFileId)
      }

      const workerOptions = { type: 'module' }

      return `export default function WorkerWrapper() {
        return new ${workerConstructor}(${JSON.stringify(
        url
      )}, ${JSON.stringify(workerOptions, null, 2)})
      }`
    }
  }
}

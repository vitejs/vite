import { ResolvedConfig } from '../config'
import { Plugin } from '../plugin'
import { resolvePlugins } from '../plugins'
import { parse as parseUrl, URLSearchParams } from 'url'
import { fileToUrl, getAssetHash } from './asset'
import { cleanUrl, injectQuery } from '../utils'
import Rollup from 'rollup'
import { ENV_PUBLIC_PATH } from '../constants'
import path from 'path'
import { onRollupWarning } from '../build'

function parseWorkerRequest(id: string): Record<string, string> | null {
  const { search } = parseUrl(id)
  if (!search) {
    return null
  }
  return Object.fromEntries(new URLSearchParams(search.slice(1)))
}

const WorkerFileId = 'worker_file'

export function webWorkerPlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'

  return {
    name: 'vite:worker',

    load(id) {
      if (isBuild) {
        const parsedQuery = parseWorkerRequest(id)
        if (
          parsedQuery &&
          (parsedQuery.worker ?? parsedQuery.sharedworker) != null
        ) {
          return ''
        }
      }
    },

    async transform(_, id) {
      const query = parseWorkerRequest(id)
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
        // bundle the file as entry to support imports
        const rollup = require('rollup') as typeof Rollup
        const bundle = await rollup.rollup({
          input: cleanUrl(id),
          plugins: await resolvePlugins({ ...config }, [], [], []),
          onwarn(warning, warn) {
            onRollupWarning(warning, warn, config)
          },
        })
        let code: string
        try {
          const { output } = await bundle.generate({
            format: 'iife',
            sourcemap: config.build.sourcemap
          })
          code = output[0].code
        } finally {
          await bundle.close()
        }
        const content = Buffer.from(code)
        if (query.inline != null) {
          // inline as blob data url
          return `const encodedJs = "${content.toString('base64')}";
            const blob = typeof window !== "undefined" && window.Blob && new Blob([atob(encodedJs)], { type: "text/javascript;charset=utf-8" });
            export default function WorkerWrapper() {
              const objURL = blob && (window.URL || window.webkitURL).createObjectURL(blob);
              try {
                return objURL ? new Worker(objURL) : new Worker("data:application/javascript;base64," + encodedJs, {type: "module"});
              } finally {
                objURL && (window.URL || window.webkitURL).revokeObjectURL(objURL);
              }
            }`
        } else {
          const basename = path.parse(cleanUrl(id)).name
          const contentHash = getAssetHash(content)
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

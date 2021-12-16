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
const ClassicWorkerQuery = 'classic'

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
        if (query[ClassicWorkerQuery] != null) {
          return {
            code:
              `self.importScripts(${JSON.stringify(ENV_PUBLIC_PATH)});\n` + _
          }
        } else {
          return {
            code: `import '${ENV_PUBLIC_PATH}'\n` + _
          }
        }
      }
      if (
        query == null ||
        (query && (query.worker ?? query.sharedworker) == null)
      ) {
        return
      }

      const workerConstructor =
        query.sharedworker != null ? 'SharedWorker' : 'Worker'

      if (isBuild) {
        // bundle the file as entry to support imports
        const rollup = require('rollup') as typeof Rollup
        const bundle = await rollup.rollup({
          input: cleanUrl(id),
          plugins: await resolvePlugins({ ...config }, [], [], []),
          onwarn(warning, warn) {
            onRollupWarning(warning, warn, config)
          }
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
            export default function WorkerWrapper(workerOptions) {
              const objURL = blob && (window.URL || window.webkitURL).createObjectURL(blob);
              try {
                return new Worker(
                  objURL || ("data:application/javascript;base64," + encodedJs),
                  Object.assign({ type: "module" }, workerOptions)
                );
              } finally {
                objURL && (window.URL || window.webkitURL).revokeObjectURL(objURL);
              }
            }`
        } else {
          // isBuild: true, inline: false
          const basename = path.parse(cleanUrl(id)).name
          const contentHash = getAssetHash(content)
          const fileName = path.posix.join(
            config.build.assetsDir,
            `${basename}.${contentHash}.js`
          )
          const url = `__VITE_ASSET__${this.emitFile({
            fileName,
            type: 'asset',
            source: code
          })}__`

          return `export default function WorkerWrapper(workerOptions) {
            return new ${workerConstructor}(
              ${JSON.stringify(url)},
              Object.assign({ type: "module" }, workerOptions)
            )
          }`
        }
      } else {
        // isBuild: false
        let url = await fileToUrl(cleanUrl(id), config, this)
        url = injectQuery(url, WorkerFileId)

        return `export default function WorkerWrapper(workerOptions) {
          workerOptions = Object.assign({ type: "module" }, workerOptions)
          let url = ${JSON.stringify(url)}
          if (workerOptions.type !== "module") {
            url += ${JSON.stringify('&' + ClassicWorkerQuery)}
          }
          return new ${workerConstructor}(url, workerOptions)
        }`
      }
    }
  }
}

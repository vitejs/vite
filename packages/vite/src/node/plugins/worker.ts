import { ResolvedConfig } from '../config'
import { Plugin } from '../plugin'
import { parse as parseUrl } from 'url'
import qs, { ParsedUrlQuery } from 'querystring'
import { fileToUrl } from './asset'
import { cleanUrl, injectQuery } from '../utils'
import Rollup from 'rollup'
import { ENV_PUBLIC_PATH } from '../constants'
import path from 'path'

function parseWorkerRequest(id: string): ParsedUrlQuery | null {
  const { search } = parseUrl(id)
  if (!search) {
    return null
  }
  return qs.parse(search.slice(1))
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
          plugins: config.plugins as Plugin[]
        })
        try {
          const { output } = await bundle.generate({
            format: 'iife',
            sourcemap: config.build.sourcemap
          })
          if (query.inline != null) {
            // inline as base64 data url
            return `const blob = new Blob([atob(\"${Buffer.from(output[0].code).toString('base64')}\")], { type: 'text/javascript;charset=utf-8' });
            export default function WorkerWrapper() {
              const objURL = (window.URL || window.webkitURL).createObjectURL(blob);
              try {
                return new Worker(objURL);
              } finally {
                (window.URL || window.webkitURL).revokeObjectURL(objURL);
              }
            }`
          } else {
            const fileName = path.parse(cleanUrl(id)).name
            url = `__VITE_ASSET__${this.emitFile({
              type: 'asset',
              name: `${fileName}.js`,
              source: output[0].code
            })}__`
          }
        } finally {
          await bundle.close()
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

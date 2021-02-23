import { ResolvedConfig } from '../config'
import { Plugin } from '../plugin'
import { parse as parseUrl } from 'url'
import qs, { ParsedUrlQuery } from 'querystring'
import { fileToUrl } from './asset'
import { cleanUrl, injectQuery } from '../utils'
import Rollup from 'rollup'
import { ENV_PUBLIC_PATH } from '../constants'

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
      if (isBuild && parseWorkerRequest(id)?.worker != null) {
        return ''
      }
    },

    async transform(_, id) {
      const query = parseWorkerRequest(id)
      if (query && query[WorkerFileId] != null) {
        return {
          code: `import '${ENV_PUBLIC_PATH}'\n` + _
        }
      }
      if (query == null || (query && query.worker == null)) {
        return
      }

      let url: string
      if (config.command === 'serve') {
        url = await fileToUrl(cleanUrl(id), config, this)
        url = injectQuery(url, WorkerFileId)
      } else {
        if (query.inline != null) {
          // bundle the file as entry to support imports and inline as base64
          // data url
          const rollup = require('rollup') as typeof Rollup
          const bundle = await rollup.rollup({
            input: cleanUrl(id),
            plugins: config.plugins as Plugin[]
          })
          try {
            const { output } = await bundle.generate({
              format: 'es',
              sourcemap: config.build.sourcemap
            })
            url = `data:application/javascript;base64,${Buffer.from(
              output[0].code
            ).toString('base64')}`
          } finally {
            bundle.close()
          }
        } else {
          // emit as separate chunk
          url = `__VITE_ASSET__${this.emitFile({
            type: 'chunk',
            id: cleanUrl(id)
          })}__`
        }
      }

      return `export default function WorkerWrapper() {
        return new Worker(${JSON.stringify(url)}, { type: 'module' })
      }`
    }
  }
}

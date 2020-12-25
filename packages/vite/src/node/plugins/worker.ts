import { ResolvedConfig } from '../config'
import { Plugin } from '../plugin'
import { parse as parseUrl } from 'url'
import qs, { ParsedUrlQuery } from 'querystring'
import { fileToUrl } from './asset'
import { cleanUrl } from '../utils'
import Rollup from 'rollup'

function isWorkerRequest(id: string): ParsedUrlQuery | false {
  const { search } = parseUrl(id)
  if (!search) {
    return false
  }
  const query = qs.parse(search.slice(1))
  return query.worker != null ? query : false
}

export function webWorkerPlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'

  return {
    name: 'vite:worker',

    load(id) {
      if (isBuild && isWorkerRequest(id)) {
        return ''
      }
    },

    async transform(_, id) {
      const query = isWorkerRequest(id)
      if (!query) {
        return
      }

      let url: string
      if (config.command === 'serve') {
        url = await fileToUrl(cleanUrl(id), config, this)
      } else {
        if (query.inline != null) {
          // bundle the file as entry to support imports and inline as base64
          // data url
          const rollup = require('rollup') as typeof Rollup
          const { resolveBuildPlugins } = await import('../build')
          const bundle = await rollup.rollup({
            input: cleanUrl(id),
            plugins: resolveBuildPlugins(config)
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
          })}`
        }
      }

      return `export default function WorkerWrapper() {
        return new Worker(${JSON.stringify(url)}, { type: 'module' })
      }`
    }
  }
}

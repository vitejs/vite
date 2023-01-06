// This is based on @rollup/plugin-data-uri
// MIT Licensed https://github.com/rollup/plugins/blob/master/LICENSE
// ref https://github.com/vitejs/vite/issues/1428#issuecomment-757033808
import { URL } from 'node:url'
import type { Plugin } from '../plugin'

const dataUriRE = /^([^/]+\/[^;,]+)(;base64)?,([\s\S]*)$/

const dataUriPrefix = `/@data-uri/`

/**
 * Build only, since importing from a data URI works natively.
 */
export function dataURIPlugin(): Plugin {
  let resolved: {
    [key: string]: string
  }

  return {
    name: 'vite:data-uri',

    buildStart() {
      resolved = {}
    },

    resolveId(id) {
      if (!dataUriRE.test(id)) {
        return null
      }

      const uri = new URL(id)
      if (uri.protocol !== 'data:') {
        return null
      }

      const match = uri.pathname.match(dataUriRE)
      if (!match) {
        return null
      }

      const [, mime, format, data] = match
      if (mime !== 'text/javascript') {
        throw new Error(
          `data URI with non-JavaScript mime type is not supported.`,
        )
      }

      // decode data
      const base64 = format && /base64/i.test(format.substring(1))
      const content = base64
        ? Buffer.from(data, 'base64').toString('utf-8')
        : data
      resolved[id] = content
      return dataUriPrefix + id
    },

    load(id) {
      if (id.startsWith(dataUriPrefix)) {
        id = id.slice(dataUriPrefix.length)
        return resolved[id] || null
      }
    },
  }
}

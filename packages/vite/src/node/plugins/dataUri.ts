// This is based on @rollup/plugin-data-uri
// MIT Licensed https://github.com/rollup/plugins/blob/master/LICENSE
// ref https://github.com/vitejs/vite/issues/1428#issuecomment-757033808
import { URL } from 'node:url'
import type { Plugin } from '../plugin'

const dataUriRE = /^([^/]+\/[^;,]+)(;base64)?,([\s\S]*)$/
const base64RE = /base64/i
const dataUriPrefix = `\0/@data-uri/`

/**
 * Build only, since importing from a data URI works natively.
 */
export function dataURIPlugin(): Plugin {
  let resolved: Map<string, string>

  return {
    name: 'vite:data-uri',

    buildStart() {
      resolved = new Map()
    },

    resolveId(id) {
      if (!dataUriRE.test(id)) {
        return
      }

      const uri = new URL(id)
      if (uri.protocol !== 'data:') {
        return
      }

      const match = uri.pathname.match(dataUriRE)
      if (!match) {
        return
      }

      const [, mime, format, data] = match
      if (mime !== 'text/javascript') {
        throw new Error(
          `data URI with non-JavaScript mime type is not supported. If you're using legacy JavaScript MIME types (such as 'application/javascript'), please use 'text/javascript' instead.`,
        )
      }

      // decode data
      const base64 = format && base64RE.test(format.substring(1))
      const content = base64
        ? Buffer.from(data, 'base64').toString('utf-8')
        : data
      resolved.set(id, content)
      return dataUriPrefix + id
    },

    load(id) {
      if (id.startsWith(dataUriPrefix)) {
        return resolved.get(id.slice(dataUriPrefix.length))
      }
    },
  }
}

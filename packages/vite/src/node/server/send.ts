import type {
  IncomingMessage,
  OutgoingHttpHeaders,
  ServerResponse,
} from 'node:http'
import path from 'node:path'
import convertSourceMap from 'convert-source-map'
import getEtag from 'etag'
import type { SourceMap } from 'rollup'
import MagicString from 'magic-string'
import { createDebugger, removeTimestampQuery } from '../utils'
import { getCodeWithSourcemap } from './sourcemap'

const debug = createDebugger('vite:send', {
  onlyWhenFocused: true,
})

const alias: Record<string, string | undefined> = {
  js: 'application/javascript',
  css: 'text/css',
  html: 'text/html',
  json: 'application/json',
}

export interface SendOptions {
  etag?: string
  cacheControl?: string
  headers?: OutgoingHttpHeaders
  map?: SourceMap | { mappings: '' } | null
}

export function send(
  req: IncomingMessage,
  res: ServerResponse,
  content: string | Buffer,
  type: string,
  options: SendOptions,
): void {
  const {
    etag = getEtag(content, { weak: true }),
    cacheControl = 'no-cache',
    headers,
    map,
  } = options

  if (res.writableEnded) {
    return
  }

  if (req.headers['if-none-match'] === etag) {
    res.statusCode = 304
    res.end()
    return
  }

  res.setHeader('Content-Type', alias[type] || type)
  res.setHeader('Cache-Control', cacheControl)
  res.setHeader('Etag', etag)

  if (headers) {
    for (const name in headers) {
      res.setHeader(name, headers[name]!)
    }
  }

  // inject source map reference
  if (map && 'version' in map && map.mappings) {
    if (type === 'js' || type === 'css') {
      content = getCodeWithSourcemap(type, content.toString(), map)
    }
  }
  // inject fallback sourcemap for js for improved debugging
  // https://github.com/vitejs/vite/pull/13514#issuecomment-1592431496
  else if (type === 'js' && (!map || map.mappings !== '')) {
    const code = content.toString()
    // if the code has existing inline sourcemap, assume it's correct and skip
    if (convertSourceMap.mapFileCommentRegex.test(code)) {
      debug?.(`Skipped injecting fallback sourcemap for ${req.url}`)
    } else {
      const urlWithoutTimestamp = removeTimestampQuery(req.url!)
      const ms = new MagicString(code)
      content = getCodeWithSourcemap(
        type,
        code,
        ms.generateMap({
          source: path.basename(urlWithoutTimestamp),
          hires: 'boundary',
          includeContent: true,
        }),
      )
    }
  }

  res.statusCode = 200
  res.end(content)
  return
}

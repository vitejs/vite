import type {
  IncomingMessage,
  OutgoingHttpHeaders,
  ServerResponse,
} from 'node:http'
import path from 'node:path'
import convertSourceMap from 'convert-source-map'
import getEtag from 'etag'
import type { SourceMap } from 'rolldown'
import { createDebugger, removeTimestampQuery } from '../utils'
import {
  genFallbackSourceMap,
  getCodeWithSourcemap,
  getCodeWithSourcemapUrl,
} from './sourcemap'

const debug = createDebugger('vite:send', {
  onlyWhenFocused: true,
})

const alias: Record<string, string | undefined> = {
  js: 'text/javascript',
  css: 'text/css',
  html: 'text/html',
  json: 'application/json',
}

export interface SendOptions {
  etag?: string
  cacheControl?: string
  headers?: OutgoingHttpHeaders
  map?: SourceMap | { mappings: '' } | null
  /**
   * When set, reference the sourcemap via this URL instead of inlining it as
   * a base64 data URI. Large inline sourcemaps can produce single response
   * lines large enough to freeze some devtools implementations when parsed
   * (https://github.com/vitejs/vite/issues/23549).
   */
  sourcemapUrl?: string
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
    sourcemapUrl,
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
      content = sourcemapUrl
        ? getCodeWithSourcemapUrl(type, content.toString(), sourcemapUrl)
        : getCodeWithSourcemap(type, content.toString(), map)
    }
  }
  // inject fallback sourcemap for js for improved debugging
  // https://github.com/vitejs/vite/pull/13514#issuecomment-1592431496
  else if (type === 'js' && (!map || map.mappings !== '')) {
    const code = content.toString()
    // if the code has existing inline sourcemap, assume it's correct and skip
    if (convertSourceMap.mapFileCommentRegex.test(code)) {
      debug?.(`Skipped injecting fallback sourcemap for ${req.url}`)
    } else if (sourcemapUrl) {
      // the same boundary map is regenerated on demand by the `.map` request
      // handler in transformMiddleware, from the same `code`
      content = getCodeWithSourcemapUrl(type, code, sourcemapUrl)
    } else {
      const urlWithoutTimestamp = removeTimestampQuery(req.url!)
      content = getCodeWithSourcemap(
        type,
        code,
        genFallbackSourceMap(code, path.basename(urlWithoutTimestamp)),
      )
    }
  }

  res.statusCode = 200
  if (req.method === 'HEAD') {
    res.end()
  } else {
    res.end(content)
  }
  return
}

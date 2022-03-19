import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http'
import getEtag from 'etag'
import type { SourceMap } from 'rollup'

const isDebug = process.env.DEBUG

const alias: Record<string, string | undefined> = {
  js: 'application/javascript',
  css: 'text/css',
  html: 'text/html',
  json: 'application/json'
}

export interface SendOptions {
  etag?: string
  cacheControl?: string
  headers?: OutgoingHttpHeaders
  map?: SourceMap | null
}

export function send(
  req: IncomingMessage,
  res: ServerResponse,
  content: string | Buffer,
  type: string,
  options: SendOptions
): void {
  const {
    etag = getEtag(content, { weak: true }),
    cacheControl = 'no-cache',
    headers,
    map
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
  if (map && map.mappings) {
    if (isDebug) {
      content += `\n/*${JSON.stringify(map, null, 2).replace(
        /\*\//g,
        '*\\/'
      )}*/\n`
    }
    content += genSourceMapString(map)
  }

  res.statusCode = 200
  res.end(content)
  return
}

function genSourceMapString(map: SourceMap | string | undefined) {
  if (typeof map !== 'string') {
    map = JSON.stringify(map)
  }
  return `\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(
    map
  ).toString('base64')}`
}

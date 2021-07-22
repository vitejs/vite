import { IncomingMessage, ServerResponse } from 'http'
import getEtag from 'etag'
import { SourceMap } from 'rollup'

const isDebug = process.env.DEBUG

const alias: Record<string, string | undefined> = {
  js: 'application/javascript',
  css: 'text/css',
  html: 'text/html',
  json: 'application/json'
}

export function send(
  req: IncomingMessage,
  res: ServerResponse,
  content: string | Buffer,
  type: string,
  etag = getEtag(content, { weak: true }),
  cacheControl = 'no-cache',
  map?: SourceMap | null
): void {
  if (req.headers['if-none-match'] === etag) {
    res.statusCode = 304
    return res.end()
  }

  res.setHeader('Content-Type', alias[type] || type)
  res.setHeader('Cache-Control', cacheControl)
  res.setHeader('Etag', etag)

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
  return res.end(content)
}

function genSourceMapString(map: SourceMap | string | undefined) {
  if (typeof map !== 'string') {
    map = JSON.stringify(map)
  }
  return `\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(
    map
  ).toString('base64')}`
}

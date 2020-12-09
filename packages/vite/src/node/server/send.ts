import { IncomingMessage } from 'connect'
import { ServerResponse } from 'http'
import getEtag from 'etag'

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
  hasMap = false
) {
  if (req.headers['if-none-match'] === etag) {
    res.statusCode = 304
    return res.end()
  }

  res.setHeader('Content-Type', alias[type] || type)
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Etag', etag)

  // inject source map reference
  if (hasMap) {
    content += `\n//# sourceMappingURL=${req.url!}.map`
  }

  res.statusCode = 200
  return res.end(content)
}

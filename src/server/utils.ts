import fs from 'fs'
import { ServerResponse } from 'http'

export function send(
  res: ServerResponse,
  source: string | Buffer,
  mime: string
) {
  res.setHeader('Content-Type', mime)
  res.end(source)
}

export function sendJS(res: ServerResponse, source: string | Buffer) {
  send(res, source, 'application/javascript')
}

export function sendJSStream(res: ServerResponse, filename: string) {
  res.setHeader('Content-Type', 'application/javascript')
  const stream = fs.createReadStream(filename)
  stream.on('open', () => {
    stream.pipe(res)
  })
  stream.on('error', (err) => {
    res.end(err)
  })
}

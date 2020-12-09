import path from 'path'
import { NextHandleFunction } from 'connect'
import sirv from 'sirv'

export function serveStaticMiddleware(dir: string): NextHandleFunction {
  const serve = sirv(dir, { dev: true, etag: true })
  return (req, res, next) => {
    const ext = path.extname(req.url!)
    // only serve the file if it's not an html request
    // so that html requests can fallthrough to our html middleware for
    // special processing
    if (ext && ext !== `.html`) {
      serve(req, res, next)
    } else {
      next()
    }
  }
}

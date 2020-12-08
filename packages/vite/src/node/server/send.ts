import fs from 'fs'
import { IncomingMessage, NextFunction } from 'connect'
import { ServerResponse } from 'http'

interface CacheEntry {
  content: string
  lastModified: number
}

const cache = new Map<string, CacheEntry>()

/**
 * Serve a file with an in-memory cache, optionally with a transform
 * The transform must be idempotent.
 */
export async function sendWithTransform(
  filename: string,
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction,
  transform?: (src: string) => string | Promise<string>
) {
  if (fs.existsSync(filename)) {
    const stats = fs.statSync(filename)
    const etag = `W/"${stats.size}-${stats.mtime.getTime()}"`
    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('ETag', etag)
    res.setHeader('Last-Midified', stats.mtime.toUTCString())

    let cached = cache.get(filename)
    if (!cached) {
      cached = {
        content: '',
        lastModified: 0
      }
      cache.set(filename, cached)
    }

    if (stats.mtimeMs !== cached.lastModified) {
      cached.lastModified = stats.mtimeMs
      let content = fs.readFileSync(filename, 'utf-8')
      if (transform) {
        try {
          // apply transforms
          content = await transform(content)
        } catch (e) {
          cache.delete(filename)
          return next(e)
        }
      }
      cached.content = content
    }

    if (req.headers['if-none-match'] === etag) {
      res.statusCode = 304
      return res.end()
    }

    res.statusCode = 200
    return res.end(cached.content)
  }

  cache.delete(filename)
  res.statusCode = 404
  res.end()
}

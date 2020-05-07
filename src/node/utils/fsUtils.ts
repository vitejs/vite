import path from 'path'
import fs from 'fs-extra'
import LRUCache from 'lru-cache'
import { Context } from 'koa'
import { Readable } from 'stream'

const getETag = require('etag')

interface CacheEntry {
  lastModified: number
  etag: string
  content: string
}

const moduleReadCache = new LRUCache<string, CacheEntry>({
  max: 10000
})

/**
 * Read a file with in-memory cache.
 * Also sets approrpriate headers and body on the Koa context.
 */
export async function cachedRead(
  ctx: Context | null,
  file: string
): Promise<string> {
  const lastModified = (await fs.stat(file)).mtimeMs
  const cached = moduleReadCache.get(file)
  if (ctx) {
    ctx.set('Cache-Control', 'no-cache')
    ctx.type = path.basename(file)
  }
  if (cached && cached.lastModified === lastModified) {
    if (ctx) {
      ctx.etag = cached.etag
      ctx.lastModified = new Date(cached.lastModified)
      if (ctx.get('If-None-Match') === ctx.etag) {
        ctx.status = 304
      }
      // still set the content for *.vue requests
      ctx.body = cached.content
    }
    return cached.content
  }
  const content = await fs.readFile(file, 'utf-8')
  const etag = getETag(content)
  moduleReadCache.set(file, {
    content,
    etag,
    lastModified
  })
  if (ctx) {
    ctx.etag = etag
    ctx.lastModified = new Date(lastModified)
    ctx.body = content
    ctx.status = 200
  }
  return content
}

/**
 * Read already set body on a Koa context and normalize it into a string.
 * Useful in post-processing middlewares.
 */
export async function readBody(
  stream: Readable | Buffer | string | null
): Promise<string | null> {
  if (stream instanceof Readable) {
    return new Promise((resolve, reject) => {
      let res = ''
      stream
        .on('data', (chunk) => (res += chunk))
        .on('error', reject)
        .on('end', () => {
          resolve(res)
        })
    })
  } else {
    return !stream || typeof stream === 'string' ? stream : stream.toString()
  }
}

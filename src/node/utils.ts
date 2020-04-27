import path from 'path'
import { promises as fs } from 'fs'
import LRUCache from 'lru-cache'
import os from 'os'
import { Context } from 'koa'

const getETag = require('etag')

interface CacheEntry {
  lastModified: number
  etag: string
  content: Buffer | string
}

const moduleReadCache = new LRUCache<string, CacheEntry>({
  max: 10000
})

export async function cachedRead(ctx: Context, file: string) {
  const lastModified = (await fs.stat(file)).mtimeMs
  const cached = moduleReadCache.get(file)
  ctx.set('Cache-Control', 'no-cache')
  ctx.type = path.basename(file)
  if (cached && cached.lastModified === lastModified) {
    ctx.etag = cached.etag
    ctx.lastModified = new Date(cached.lastModified)
    ctx.status = 304
    // still set the content for *.vue requests
    ctx.body = cached.content
    return cached.content
  }
  const content = await fs.readFile(file, 'utf-8')
  const etag = getETag(content)
  moduleReadCache.set(file, {
    content,
    etag,
    lastModified
  })
  ctx.etag = etag
  ctx.lastModified = new Date(lastModified)
  ctx.body = content
  ctx.status = 200
}

export function getIPv4AddressList(): string[] {
  const networkInterfaces = os.networkInterfaces()
  let result: string[] = []

  Object.keys(networkInterfaces).forEach((key) => {
    const ips = (networkInterfaces[key] || [])
      .filter((details) => details.family === 'IPv4')
      .map((detail) => detail.address.replace('127.0.0.1', 'localhost'))

    result = result.concat(ips)
  })

  return result
}

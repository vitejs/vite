import path from 'path'
import { promises as fs } from 'fs'
import LRUCache from 'lru-cache'
import os from 'os'
import { Context } from 'koa'
import { Readable } from 'stream'

const imageRE = /\.(png|jpe?g|gif|svg)(\?.*)?$/
const mediaRE = /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/
const fontsRE = /\.(woff2?|eot|ttf|otf)(\?.*)?$/i

export const isStaticAsset = (file: string) => {
  return imageRE.test(file) || mediaRE.test(file) || fontsRE.test(file)
}

const getETag = require('etag')

interface CacheEntry {
  lastModified: number
  etag: string
  content: string
}

const moduleReadCache = new LRUCache<string, CacheEntry>({
  max: 10000
})

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

export async function readBody(
  stream: Readable | Buffer | string
): Promise<string> {
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
    return typeof stream === 'string' ? stream : stream.toString()
  }
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

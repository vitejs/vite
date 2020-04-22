import { promises as fs } from 'fs'
import LRUCache from 'lru-cache'

interface CacheEntry {
  lastModified: number
  content: Buffer | string
}

const moduleReadCache = new LRUCache<string, CacheEntry>({
  max: 10000
})

export function cachedRead(path: string): Promise<Buffer>
export function cachedRead(path: string, encoding: string): Promise<string>
export async function cachedRead(path: string, encoding?: string) {
  const lastModified = (await fs.stat(path)).mtimeMs
  const cached = moduleReadCache.get(path)
  if (cached && cached.lastModified === lastModified) {
    return cached.content
  }
  const content = await fs.readFile(path, encoding)
  moduleReadCache.set(path, {
    content,
    lastModified
  })
  return content
}

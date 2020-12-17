import { SFCDescriptor } from '@vue/compiler-sfc'

const cache = new Map<string, SFCDescriptor>()
const prevCache = new Map<string, SFCDescriptor | undefined>()

export function setDescriptor(filename: string, entry: SFCDescriptor) {
  cache.set(filename, entry)
}

export function getPrevDescriptor(filename: string) {
  return prevCache.get(filename)
}

export function setPrevDescriptor(filename: string, entry: SFCDescriptor) {
  prevCache.set(filename, entry)
}

export function getDescriptor(filename: string) {
  if (cache.has(filename)) {
    return cache.get(filename)!
  }
  throw new Error(
    `${filename} has no corresponding SFC entry in the cache. ` +
      `This is a @vitejs/plugin-vue internal error, please open an issue.`
  )
}

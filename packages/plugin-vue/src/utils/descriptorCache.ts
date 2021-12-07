import fs from 'fs'
import path from 'path'
import slash from 'slash'
import hash from 'hash-sum'
import { CompilerError, SFCDescriptor } from '@vue/compiler-sfc'
import { ResolvedOptions } from '..'
import { compiler } from '../compiler'

// node_modules/@vue/compiler-sfc/dist/compiler-sfc.d.ts SFCParseResult should be exported so it can be re-used
export interface SFCParseResult {
  descriptor: SFCDescriptor
  errors: Array<CompilerError | SyntaxError>
}

const cache = new Map<string, SFCDescriptor | Array<SFCDescriptor>>()
const prevCache = new Map<string, SFCDescriptor | undefined>()

export function createDescriptor(
  filename: string,
  source: string,
  { root, isProduction, sourceMap }: ResolvedOptions
): SFCParseResult {
  const { descriptor, errors } = compiler.parse(source, {
    filename,
    sourceMap
  })

  // ensure the path is normalized in a way that is consistent inside
  // project (relative to root) and on different systems.
  const normalizedPath = slash(path.normalize(path.relative(root, filename)))
  descriptor.id = hash(normalizedPath + (isProduction ? source : ''))

  cache.set(filename, descriptor)
  return { descriptor, errors }
}

export function getPrevDescriptor(filename: string): SFCDescriptor | undefined {
  return prevCache.get(filename)
}

export function setPrevDescriptor(
  filename: string,
  entry: SFCDescriptor
): void {
  prevCache.set(filename, entry)
}

export function getDescriptor(
  filename: string,
  options: ResolvedOptions,
  createIfNotFound = true,
  id?: string
): SFCDescriptor | undefined {
  if (cache.has(filename)) {
    const ds = cache.get(filename)
    if (Array.isArray(ds) && id && id.includes('target')) {
      let target = /target=(.+)/.exec(id)?.[1]
      if (target?.includes('&')) {
        target = /(.+)&/.exec(target)?.[1]
      }
      if (target) {
        return ds.find(({ filename }) => filename === target)
      }
    }
    return ds as SFCDescriptor
  }
  if (createIfNotFound) {
    const { descriptor, errors } = createDescriptor(
      filename,
      fs.readFileSync(filename, 'utf-8'),
      options
    )
    if (errors) {
      throw errors[0]
    }
    return descriptor
  }
}

export function setDescriptor(filename: string, entry: SFCDescriptor): void {
  const ds = cache.get(filename)
  if (ds) {
    if (Array.isArray(ds)) {
      cache.set(filename, [...ds, entry])
    } else {
      cache.set(filename, [ds, entry])
    }
    return
  }
  cache.set(filename, entry)
}

import path from 'path'
import slash from 'slash'
import hash from 'hash-sum'
import { parse, SFCDescriptor } from '@vue/component-compiler-utils'
import * as vueTemplateCompiler from 'vue-template-compiler'
import { ResolvedOptions } from '../index'
import { RawSourceMap, SourceMapGenerator } from 'source-map'

const cache = new Map<string, SFCDescriptor>()
const prevCache = new Map<string, SFCDescriptor | undefined>()

export function createDescriptor(
  source: string,
  filename: string,
  { root, isProduction, vueTemplateOptions }: ResolvedOptions
) {
  const descriptor = parse({
    source,
    compiler: vueTemplateOptions?.compiler || (vueTemplateCompiler as any),
    filename,
    sourceRoot: root,
    needMap: true,
  })
  // v2 hasn't generate template and customBlocks map
  if (descriptor.template && !descriptor.template.src) {
    descriptor.template.map = generateSourceMap(
      filename,
      source,
      descriptor.template.content,
      root
    )
  }
  if (descriptor.customBlocks) {
    descriptor.customBlocks.forEach((customBlock) => {
      customBlock.map = generateSourceMap(
        filename,
        source,
        customBlock.content,
        root
      )
    })
  }
  // ensure the path is normalized in a way that is consistent inside
  // project (relative to root) and on different systems.
  const normalizedPath = slash(path.normalize(path.relative(root, filename)))
  descriptor.id = hash(normalizedPath + (isProduction ? source : ''))

  cache.set(filename, descriptor)
  return descriptor
}

export function getPrevDescriptor(filename: string) {
  return prevCache.get(filename)
}

export function setPrevDescriptor(filename: string, entry: SFCDescriptor) {
  prevCache.set(filename, entry)
}

export function getDescriptor(filename: string, errorOnMissing = true) {
  if (cache.has(filename)) {
    return cache.get(filename)!
  }
  if (errorOnMissing) {
    throw new Error(
      `${filename} has no corresponding SFC entry in the cache. ` +
        `This is a vite-plugin-vue2 internal error, please open an issue.`
    )
  }
}

export function setDescriptor(filename: string, entry: SFCDescriptor) {
  cache.set(filename, entry)
}

const splitRE = /\r?\n/g
const emptyRE = /^(?:\/\/)?\s*$/

function generateSourceMap(
  filename: string,
  source: string,
  generated: string,
  sourceRoot: string
): RawSourceMap {
  const map = new SourceMapGenerator({
    file: filename.replace(/\\/g, '/'),
    sourceRoot: sourceRoot.replace(/\\/g, '/'),
  })
  const offset = source.split(generated).shift()!.split(splitRE).length - 1

  map.setSourceContent(filename, source)
  generated.split(splitRE).forEach((line, index) => {
    if (!emptyRE.test(line)) {
      map.addMapping({
        source: filename,
        original: {
          line: index + 1 + offset,
          column: 0,
        },
        generated: {
          line: index + 1,
          column: 0,
        },
      })
    }
  })
  return JSON.parse(map.toString())
}

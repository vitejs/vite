import { promises as fs } from 'fs'
import path from 'path'
import getEtag from 'etag'
import * as convertSourceMap from 'convert-source-map'
import { SourceDescription, SourceMap } from 'rollup'
import { ViteDevServer } from '..'
import chalk from 'chalk'
import {
  createDebugger,
  cleanUrl,
  prettifyUrl,
  removeTimestampQuery,
  timeFrom
} from '../utils'
import { checkPublicFile } from '../plugins/asset'
import { ssrTransform } from './ssrTransform'

const debugLoad = createDebugger('vite:load')
const debugTransform = createDebugger('vite:transform')
const debugCache = createDebugger('vite:cache')
const isDebug = !!process.env.DEBUG

export interface TransformResult {
  code: string
  map: SourceMap | null
  etag?: string
  deps?: string[]
}

export interface TransformOptions {
  ssr?: boolean
}

export async function transformRequest(
  url: string,
  {
    config: { root, logger },
    pluginContainer,
    moduleGraph,
    watcher
  }: ViteDevServer,
  { ssr }: TransformOptions = {}
): Promise<TransformResult | null> {
  url = removeTimestampQuery(url)
  const prettyUrl = isDebug ? prettifyUrl(url, root) : ''

  // check if we have a fresh cache
  const module = await moduleGraph.getModuleByUrl(url)
  const cached =
    module && (ssr ? module.ssrTransformResult : module.transformResult)
  if (cached) {
    isDebug && debugCache(`[memory] ${prettyUrl}`)
    return cached
  }

  // resolve
  const id = (await pluginContainer.resolveId(url))?.id || url
  const file = cleanUrl(id)

  let code = null
  let map: SourceDescription['map'] = null

  // load
  const loadStart = Date.now()
  const loadResult = await pluginContainer.load(id, ssr)
  if (loadResult == null) {
    // try fallback loading it from fs as string
    // if the file is a binary, there should be a plugin that already loaded it
    // as string
    try {
      code = await fs.readFile(file, 'utf-8')
      isDebug && debugLoad(`${timeFrom(loadStart)} [fs] ${prettyUrl}`)
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e
      }
    }
    if (code) {
      try {
        map = (
          convertSourceMap.fromSource(code) ||
          convertSourceMap.fromMapFileSource(code, path.dirname(file))
        )?.toObject()
      } catch (e) {
        logger.warn(`Failed to load source map for ${url}.`, {
          timestamp: true
        })
      }
    }
  } else {
    isDebug && debugLoad(`${timeFrom(loadStart)} [plugin] ${prettyUrl}`)
    if (typeof loadResult === 'object') {
      code = loadResult.code
      map = loadResult.map
    } else {
      code = loadResult
    }
  }
  if (code == null) {
    const msg = checkPublicFile(url, root)
      ? `This file is in /public and will be copied as-is during build without ` +
        `going through the plugin transforms, and therefore should not be ` +
        `imported from source code. It can only be referenced via HTML tags.`
      : `Does the file exist?`
    throw new Error(`Failed to load url ${url} (resolved id: ${id}). ${msg}`)
  }

  // ensure module in graph after successful load
  const mod = await moduleGraph.ensureEntryFromUrl(url)
  // file is out of root, add it to the watch list
  if (
    mod.file &&
    !mod.file.startsWith(root + '/') &&
    // some rollup plugins use null bytes for private resolved Ids
    !mod.file.includes('\0')
  ) {
    watcher.add(mod.file)
  }

  // transform
  const transformStart = Date.now()
  const transformResult = await pluginContainer.transform(code, id, map, ssr)
  if (
    transformResult == null ||
    (typeof transformResult === 'object' && transformResult.code == null)
  ) {
    // no transform applied, keep code as-is
    isDebug &&
      debugTransform(
        timeFrom(transformStart) + chalk.dim(` [skipped] ${prettyUrl}`)
      )
  } else {
    isDebug && debugTransform(`${timeFrom(transformStart)} ${prettyUrl}`)
    if (typeof transformResult === 'object') {
      code = transformResult.code!
      map = transformResult.map
    } else {
      code = transformResult
    }
  }

  if (ssr) {
    return (mod.ssrTransformResult = await ssrTransform(code, map as SourceMap))
  } else {
    return (mod.transformResult = {
      code,
      map,
      etag: getEtag(code, { weak: true })
    } as TransformResult)
  }
}

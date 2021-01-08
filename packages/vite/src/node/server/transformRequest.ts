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

const debugLoad = createDebugger('vite:load')
const debugTransform = createDebugger('vite:transform')
const debugCache = createDebugger('vite:cache')
const isDebug = !!process.env.DEBUG

export interface TransformResult {
  code: string
  map: SourceMap | null
  etag: string
}

export async function transformRequest(
  url: string,
  { config: { root }, pluginContainer, moduleGraph, watcher }: ViteDevServer
): Promise<TransformResult | null> {
  url = removeTimestampQuery(url)
  const prettyUrl = isDebug ? prettifyUrl(url, root) : ''

  // check if we have a fresh cache
  const cached = (await moduleGraph.getModuleByUrl(url))?.transformResult
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
  const loadResult = await pluginContainer.load(id)
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
      map = (
        convertSourceMap.fromSource(code) ||
        convertSourceMap.fromMapFileSource(code, path.dirname(file))
      )?.toObject()
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
    throw new Error(
      `Failed to load url ${url} (resolved id: ${id}). Does the file exist?`
    )
  }

  // ensure module in graph after successful load
  const mod = await moduleGraph.ensureEntryFromUrl(url)
  // file is out of root, add it to the watch list
  if (mod.file && !mod.file.startsWith(root + '/')) {
    watcher.add(mod.file)
  }

  // transform
  const transformStart = Date.now()
  const transformResult = await pluginContainer.transform(code, id, map)
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

  return (mod.transformResult = {
    code,
    map,
    etag: getEtag(code, { weak: true })
  } as TransformResult)
}

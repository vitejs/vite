import { pathToFileURL } from 'node:url'
import type { ModuleNode, TransformResult, ViteDevServer } from '..'
import type { InternalResolveOptionsWithOverrideConditions } from '../plugins/resolve'
import { tryNodeResolve } from '../plugins/resolve'
import { isBuiltin, isExternalUrl, isFilePathESM } from '../utils'
import type { FetchResult } from '../../runtime/types'
import { unwrapId } from '../../shared/utils'
import {
  SOURCEMAPPING_URL,
  VITE_RUNTIME_SOURCEMAPPING_SOURCE,
} from '../../shared/constants'
import { genSourceMapUrl } from '../server/sourcemap'

export interface FetchModuleOptions {
  inlineSourceMap?: boolean
  processSourceMap?<T extends NonNullable<TransformResult['map']>>(map: T): T
}

/**
 * Fetch module information for Vite runtime.
 * @experimental
 */
export async function fetchModule(
  server: ViteDevServer,
  url: string,
  importer?: string,
  options: FetchModuleOptions = {},
): Promise<FetchResult> {
  // builtins should always be externalized
  if (url.startsWith('data:') || isBuiltin(url)) {
    return { externalize: url, type: 'builtin' }
  }

  if (isExternalUrl(url)) {
    return { externalize: url, type: 'network' }
  }

  if (url[0] !== '.' && url[0] !== '/') {
    const {
      isProduction,
      resolve: { dedupe, preserveSymlinks },
      root,
      ssr,
    } = server.config
    const overrideConditions = ssr.resolve?.externalConditions || []

    const resolveOptions: InternalResolveOptionsWithOverrideConditions = {
      mainFields: ['main'],
      conditions: [],
      overrideConditions: [...overrideConditions, 'production', 'development'],
      extensions: ['.js', '.cjs', '.json'],
      dedupe,
      preserveSymlinks,
      isBuild: false,
      isProduction,
      root,
      ssrConfig: ssr,
      packageCache: server.config.packageCache,
    }

    const resolved = tryNodeResolve(
      url,
      importer,
      { ...resolveOptions, tryEsmOnly: true },
      false,
      undefined,
      true,
    )
    if (!resolved) {
      const err: any = new Error(
        `Cannot find module '${url}' imported from '${importer}'`,
      )
      err.code = 'ERR_MODULE_NOT_FOUND'
      throw err
    }
    const file = pathToFileURL(resolved.id).toString()
    const type = isFilePathESM(resolved.id, server.config.packageCache)
      ? 'module'
      : 'commonjs'
    return { externalize: file, type }
  }

  url = unwrapId(url)

  let result = await server.transformRequest(url, { ssr: true })

  if (!result) {
    throw new Error(
      `[vite] transform failed for module '${url}'${
        importer ? ` imported from '${importer}'` : ''
      }.`,
    )
  }

  // module entry should be created by transformRequest
  const mod = await server.moduleGraph.getModuleByUrl(url, true)

  if (!mod) {
    throw new Error(
      `[vite] cannot find module '${url}' ${
        importer ? ` imported from '${importer}'` : ''
      }.`,
    )
  }

  if (options.inlineSourceMap !== false) {
    result = inlineSourceMap(mod, result, options.processSourceMap)
  }

  // remove shebang
  if (result.code[0] === '#')
    result.code = result.code.replace(/^#!.*/, (s) => ' '.repeat(s.length))

  return { code: result.code, file: mod.file }
}

const OTHER_SOURCE_MAP_REGEXP = new RegExp(
  `//# ${SOURCEMAPPING_URL}=data:application/json[^,]+base64,([A-Za-z0-9+/=]+)$`,
  'gm',
)

function inlineSourceMap(
  mod: ModuleNode,
  result: TransformResult,
  processSourceMap?: FetchModuleOptions['processSourceMap'],
) {
  const map = result.map
  let code = result.code

  if (
    !map ||
    !('version' in map) ||
    code.includes(VITE_RUNTIME_SOURCEMAPPING_SOURCE)
  )
    return result

  // to reduce the payload size, we only inline vite node source map, because it's also the only one we use
  OTHER_SOURCE_MAP_REGEXP.lastIndex = 0
  if (OTHER_SOURCE_MAP_REGEXP.test(code))
    code = code.replace(OTHER_SOURCE_MAP_REGEXP, '')

  const sourceMap = processSourceMap?.(map) || map
  result.code = `${code.trimEnd()}\n//# sourceURL=${
    mod.id
  }\n${VITE_RUNTIME_SOURCEMAPPING_SOURCE}\n//# ${SOURCEMAPPING_URL}=${genSourceMapUrl(sourceMap)}\n`

  return result
}

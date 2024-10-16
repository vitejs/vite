import { pathToFileURL } from 'node:url'
import type { FetchResult } from 'vite/module-runner'
import type { EnvironmentModuleNode, TransformResult } from '..'
import { tryNodeResolve } from '../plugins/resolve'
import { isBuiltin, isExternalUrl, isFilePathESM } from '../utils'
import { isWindows, slash, unwrapId } from '../../shared/utils'
import {
  MODULE_RUNNER_SOURCEMAPPING_SOURCE,
  SOURCEMAPPING_URL,
} from '../../shared/constants'
import { genSourceMapUrl } from '../server/sourcemap'
import type { DevEnvironment } from '../server/environment'
import { normalizeResolvedIdToUrl } from '../plugins/importAnalysis'

export interface FetchModuleOptions {
  cached?: boolean
  inlineSourceMap?: boolean
  startOffset?: number
}

/**
 * Fetch module information for Vite runner.
 * @experimental
 */
export async function fetchModule(
  environment: DevEnvironment,
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

  // support 'file://' by default like node, but this is a different behavior from browser
  url = slash(url)
  const isFileUrl = url.startsWith('file://')

  // if there is no importer, the file is an entry point
  // entry points are always internalized
  if (!isFileUrl && importer && url[0] !== '.' && url[0] !== '/') {
    const { isProduction, root } = environment.config
    const { externalConditions, dedupe, preserveSymlinks } =
      environment.config.resolve

    const resolved = tryNodeResolve(
      url,
      importer,
      {
        mainFields: ['main'],
        conditions: [],
        externalConditions,
        external: [],
        noExternal: [],
        overrideConditions: [
          ...externalConditions,
          'production',
          'development',
        ],
        extensions: ['.js', '.cjs', '.json'],
        dedupe,
        preserveSymlinks,
        isBuild: false,
        isProduction,
        root,
        packageCache: environment.config.packageCache,
        tryEsmOnly: true,
        webCompatible: environment.config.webCompatible,
      },
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
    const type = isFilePathESM(resolved.id, environment.config.packageCache)
      ? 'module'
      : 'commonjs'
    return { externalize: file, type }
  }

  // file:///root/id.js -> /root/id.js
  // file:///C:/root/id.js -> C:/root/id.js
  if (isFileUrl) {
    // 8 is the length of "file:///"
    url = url.slice(isWindows ? 8 : 7)
  }

  // this is an entry point module, very high chance it's not resolved yet
  // for example: runner.import('./some-file') or runner.import('/some-file')
  if (!importer) {
    const resolved = await environment.pluginContainer.resolveId(url)
    if (!resolved) {
      throw new Error(`[vite] cannot find entry point module '${url}'.`)
    }
    url = normalizeResolvedIdToUrl(environment, url, resolved)
  }

  url = unwrapId(url)

  let mod = await environment.moduleGraph.ensureEntryFromUrl(url)
  const cached = !!mod?.transformResult

  // if url is already cached, we can just confirm it's also cached on the server
  if (options.cached && cached) {
    return { cache: true }
  }

  let result = await environment.transformRequest(url)

  if (!result) {
    throw new Error(
      `[vite] transform failed for module '${url}'${
        importer ? ` imported from '${importer}'` : ''
      }.`,
    )
  }

  // module entry should be created by transformRequest
  const modById = environment.moduleGraph.getModuleById(mod.id!)

  if (!modById) {
    throw new Error(
      `[vite] cannot find module '${url}' ${
        importer ? ` imported from '${importer}'` : ''
      }.`,
    )
  }
  mod = modById

  if (options.inlineSourceMap !== false) {
    result = inlineSourceMap(mod, result, options.startOffset)
  }

  // remove shebang
  if (result.code[0] === '#')
    result.code = result.code.replace(/^#!.*/, (s) => ' '.repeat(s.length))

  return {
    code: result.code,
    file: mod.file,
    id: mod.id!,
    url: mod.url,
    invalidate: !cached,
  }
}

const OTHER_SOURCE_MAP_REGEXP = new RegExp(
  `//# ${SOURCEMAPPING_URL}=data:application/json[^,]+base64,([A-Za-z0-9+/=]+)$`,
  'gm',
)

function inlineSourceMap(
  mod: EnvironmentModuleNode,
  result: TransformResult,
  startOffset: number | undefined,
) {
  const map = result.map
  let code = result.code

  if (
    !map ||
    !('version' in map) ||
    code.includes(MODULE_RUNNER_SOURCEMAPPING_SOURCE)
  )
    return result

  // to reduce the payload size, we only inline vite node source map, because it's also the only one we use
  OTHER_SOURCE_MAP_REGEXP.lastIndex = 0
  if (OTHER_SOURCE_MAP_REGEXP.test(code))
    code = code.replace(OTHER_SOURCE_MAP_REGEXP, '')

  const sourceMap = startOffset
    ? Object.assign({}, map, {
        mappings: ';'.repeat(startOffset) + map.mappings,
      })
    : map
  result.code = `${code.trimEnd()}\n//# sourceURL=${
    mod.id
  }\n${MODULE_RUNNER_SOURCEMAPPING_SOURCE}\n//# ${SOURCEMAPPING_URL}=${genSourceMapUrl(sourceMap)}\n`

  return result
}

import { pathToFileURL } from 'node:url'
import type { ModuleNode, TransformResult, ViteDevServer } from '..'
import type { PackageCache } from '../packages'
import type { InternalResolveOptionsWithOverrideConditions } from '../plugins/resolve'
import { tryNodeResolve } from '../plugins/resolve'
import { isBuiltin, isFilePathESM, unwrapId } from '../utils'
import type { FetchResult } from './runtime/types'

interface NodeImportResolveOptions
  extends InternalResolveOptionsWithOverrideConditions {
  legacyProxySsrExternalModules?: boolean
  packageCache?: PackageCache
}

interface FetchModuleOptions {
  /**
   * @default true
   */
  inlineSourceMap?:
    | boolean
    | ((mod: ModuleNode, result: TransformResult) => TransformResult)
}

export async function ssrFetchModule(
  server: ViteDevServer,
  rawId: string,
  importer?: string,
  options: FetchModuleOptions = {},
): Promise<FetchResult> {
  // builtins should always be externalized
  if (rawId.startsWith('data:') || isBuiltin(rawId)) {
    return { externalize: rawId, type: 'builtin' }
  }

  if (rawId[0] !== '.' && rawId[0] !== '/') {
    const {
      isProduction,
      resolve: { dedupe, preserveSymlinks },
      root,
      ssr,
    } = server.config
    const overrideConditions = ssr.resolve?.externalConditions || []

    const resolveOptions: NodeImportResolveOptions = {
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
      legacyProxySsrExternalModules:
        server.config.legacy?.proxySsrExternalModules,
      packageCache: server.config.packageCache,
    }

    const resolved = tryNodeResolve(
      rawId,
      importer,
      { ...resolveOptions, tryEsmOnly: true },
      false,
      undefined,
      true,
    )
    if (!resolved) {
      const err: any = new Error(
        `Cannot find module '${rawId}' imported from '${importer}'`,
      )
      err.code = 'ERR_MODULE_NOT_FOUND'
      throw err
    }
    const url = pathToFileURL(resolved.id).toString()
    const type = isFilePathESM(url, server.config.packageCache)
      ? 'module'
      : 'commonjs'
    return { externalize: url, type }
  }

  const id = unwrapId(rawId)

  const mod = await server.moduleGraph.ensureEntryFromUrl(id, true)
  let result = await server.transformRequest(id, { ssr: true })

  if (!result) {
    throw new Error(
      `[vite] transform failed for module '${id}'${
        importer ? ` imported from ${importer}` : ''
      }.`,
    )
  }

  if (typeof options.inlineSourceMap === 'function') {
    result = options.inlineSourceMap(mod, result)
  } else if (options.inlineSourceMap !== false) {
    result = inlineSourceMap(mod, result)
  }

  // remove shebang
  if (result.code[0] === '#')
    result.code = result.code.replace(/^#!.*/, (s) => ' '.repeat(s.length))

  return { code: result.code, file: mod.file, id }
}

let SOURCEMAPPING_URL = 'sourceMa'
SOURCEMAPPING_URL += 'ppingURL'

const VITE_RUNTIME_SOURCEMAPPING_SOURCE = '//# sourceMappingSource=vite-runtime'
const VITE_RUNTIME_SOURCEMAPPING_URL = `${SOURCEMAPPING_URL}=data:application/json;charset=utf-8`

// eslint-disable-next-line @typescript-eslint/no-empty-function
const AsyncFunction = async function () {}.constructor as typeof Function
const fnDeclarationLineCount = (() => {
  const body = '/*code*/'
  const source = new AsyncFunction('a', 'b', body).toString()
  return source.slice(0, source.indexOf(body)).split('\n').length - 1
})()

function inlineSourceMap(mod: ModuleNode, result: TransformResult) {
  const map = result.map
  let code = result.code

  if (
    !map ||
    !('version' in map) ||
    code.includes(VITE_RUNTIME_SOURCEMAPPING_SOURCE)
  )
    return result

  // to reduce the payload size, we only inline vite node source map, because it's also the only one we use
  const OTHER_SOURCE_MAP_REGEXP = new RegExp(
    `//# ${SOURCEMAPPING_URL}=data:application/json[^,]+base64,([A-Za-z0-9+/=]+)$`,
    'gm',
  )
  while (OTHER_SOURCE_MAP_REGEXP.test(code))
    code = code.replace(OTHER_SOURCE_MAP_REGEXP, '')

  // this assumes that "new AsyncFunction" is used to create the module
  const moduleSourceMap = Object.assign({}, map, {
    sourcesContent: undefined, // remove sourcesContent because _we_ don't use it, it also reduces the payload size
    // currently we need to offset the line
    // https://github.com/nodejs/node/issues/43047#issuecomment-1180632750
    mappings: ';'.repeat(fnDeclarationLineCount) + map.mappings,
  })

  const sourceMap = Buffer.from(
    JSON.stringify(moduleSourceMap),
    'utf-8',
  ).toString('base64')
  result.code = `${code.trimEnd()}\n//# sourceURL=${
    mod.id
  }\n${VITE_RUNTIME_SOURCEMAPPING_SOURCE}\n//# ${VITE_RUNTIME_SOURCEMAPPING_URL};base64,${sourceMap}\n`

  return result
}

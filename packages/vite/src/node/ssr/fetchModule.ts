import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { FetchResult } from 'vite/module-runner'
import type { TransformResult } from '..'
import {
  MODULE_RUNNER_SOURCEMAPPING_SOURCE,
  SOURCEMAPPING_URL,
} from '../../shared/constants'
import type { ViteFetchResult } from '../../shared/invokeMethods'
import { cleanUrl, encodeSourceURL, unwrapId } from '../../shared/utils'
import { tryNodeResolve } from '../plugins/resolve'
import type { BundledDev } from '../server/bundledDev'
import type { DevEnvironment } from '../server/environment'
import { genSourceMapUrl } from '../server/sourcemap'
import {
  isBuiltin,
  isExternalUrl,
  isFilePathESM,
  normalizePath,
} from '../utils'
import { ssrTransform } from './ssrTransform'

export interface FetchModuleOptions {
  cached?: boolean
  inlineSourceMap?: boolean
  startOffset?: number
}

/**
 * Fetch module information for Vite module runner.
 * @experimental
 */
export async function fetchModule(
  environment: DevEnvironment,
  moduleRunnerUrl: string,
  importerId?: string,
  options: FetchModuleOptions = {},
): Promise<FetchResult> {
  if (
    moduleRunnerUrl.startsWith('data:') ||
    isBuiltin(environment.config.resolve.builtins, moduleRunnerUrl)
  ) {
    return { externalize: moduleRunnerUrl, type: 'builtin' }
  }

  // handle file urls from not statically analyzable dynamic import
  const isFileUrl = moduleRunnerUrl.startsWith('file://')

  if (isExternalUrl(moduleRunnerUrl) && !isFileUrl) {
    return { externalize: moduleRunnerUrl, type: 'network' }
  }

  // if there is no importer, the file is an entry point
  // entry points are always internalized
  if (
    !isFileUrl &&
    importerId &&
    moduleRunnerUrl[0] !== '.' &&
    moduleRunnerUrl[0] !== '/' &&
    !isBundledChunkUrl(environment, moduleRunnerUrl)
  ) {
    const { isProduction, root } = environment.config
    const { externalConditions, dedupe, preserveSymlinks } =
      environment.config.resolve

    const resolved = tryNodeResolve(moduleRunnerUrl, importerId, {
      mainFields: ['main'],
      conditions: externalConditions,
      externalConditions,
      external: [],
      noExternal: [],
      extensions: ['.js', '.cjs', '.json'],
      dedupe,
      preserveSymlinks,
      tsconfigPaths: false,
      isBuild: false,
      isProduction,
      root,
      packageCache: environment.config.packageCache,
      builtins: environment.config.resolve.builtins,
    })
    if (!resolved) {
      const err: any = new Error(
        `Cannot find module '${moduleRunnerUrl}' imported from '${importerId}'`,
      )
      err.code = 'ERR_MODULE_NOT_FOUND'
      throw err
    }
    const externalFileUrl = pathToFileURL(resolved.id).toString()
    const type = isFilePathESM(resolved.id, environment.config.packageCache)
      ? 'module'
      : 'commonjs'
    return { externalize: externalFileUrl, type }
  }

  // The module graph and transform pipeline use unwrapped ModuleURLs.
  const moduleUrl = unwrapId(moduleRunnerUrl)

  const bundledDev = environment.bundledDev

  if (bundledDev) {
    return fetchBundledModule(
      environment,
      bundledDev,
      moduleUrl,
      importerId,
      options,
    )
  }

  const mod = await environment.moduleGraph.ensureEntryFromUrl(moduleUrl)
  const cached = !!mod.transformResult

  // if moduleUrl is already cached, we can just confirm it's also cached on the server
  if (options.cached && cached) {
    return { cache: true }
  }

  let result = await environment.transformRequest(moduleUrl)

  if (!result) {
    throw new Error(
      `[vite] transform failed for module '${moduleUrl}'${
        importerId ? ` imported from '${importerId}'` : ''
      }.`,
    )
  }

  if (options.inlineSourceMap !== false) {
    result = inlineSourceMap(mod.id!, result, options.startOffset)
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

async function fetchBundledModule(
  environment: DevEnvironment,
  bundledDev: BundledDev,
  moduleUrl: string,
  importerId: string | undefined,
  options: FetchModuleOptions,
) {
  await bundledDev._waitForInitialBuildSuccess()

  if (moduleUrl.startsWith('/@vite/lazy?')) {
    const { searchParams } = new URL(moduleUrl, 'http://localhost')
    const rolldownModuleId = searchParams.get('id')!
    const clientId = searchParams.get('clientId')!
    const lazyResult = await bundledDev.triggerLazyBundling(
      rolldownModuleId,
      clientId,
    )
    if (lazyResult == null) {
      throw new Error(`unknown request: ${moduleUrl}`)
    }
    // This module is invalidated immediately, so url/id do not matter
    const result: ViteFetchResult = {
      code: lazyResult.code,
      url: moduleUrl,
      id: rolldownModuleId!,
      file: cleanUrl(rolldownModuleId!),
      invalidate: false,
    }

    // See https://github.com/rolldown/rolldown/issues/8376
    const ssrResult = await ssrTransform(
      result.code,
      lazyResult.sourcemap ? JSON.parse(lazyResult.sourcemap) : null,
      moduleUrl,
      result.code,
    )
    if (!ssrResult) {
      throw new Error(`[vite] cannot apply ssr transform to '${moduleUrl}'.`)
    }
    result.code = ssrResult.code
    if (options.inlineSourceMap !== false) {
      result.code = inlineSourceMap(
        result.id,
        ssrResult,
        options.startOffset,
      ).code
    }
    return result
  }

  const outDir = normalizePath(
    path.resolve(environment.config.root, environment.config.build.outDir),
  )

  let chunkFileName: string
  let facadeModuleId: string | undefined

  // Assume this is an entry point that was specified in rolldownOptions.input
  if (!importerId) {
    const resolvedEntry = await resolveBundledEntryFilename(
      bundledDev,
      environment.config.root,
      moduleUrl,
    )
    if (!resolvedEntry) {
      const entrypoints = [...bundledDev.facadeToChunk.keys()]
      throw new Error(
        `[vite] Entrypoint '${moduleUrl}' was not defined in the config. ` +
          (entrypoints.length
            ? `Available entry points: \n- ${[...bundledDev.facadeToChunk.keys()].join('\n- ')}`
            : `The build did not produce any chunks. Did it finish successfully? See the logs for more information.`),
      )
    }
    ;[facadeModuleId, chunkFileName] = resolvedEntry
  } else if (moduleUrl[0] === '.') {
    // Importer is reported as a full path on the file system.
    // This happens because we provide the `file` attribute.
    if (importerId.startsWith(outDir)) {
      importerId = importerId.slice(outDir.length + 1)
    }
    chunkFileName = path.posix.join(path.posix.dirname(importerId), moduleUrl)
  } else {
    chunkFileName = moduleUrl
  }

  const memoryFile = bundledDev.memoryFiles.get(chunkFileName)
  const code = memoryFile?.source
  if (code == null) {
    throw new Error(
      `[vite] the module '${moduleUrl}' (chunk '${chunkFileName}') ${
        importerId ? ` imported from '${importerId}'` : ''
      } was not bundled. Is server established?`,
    )
  }
  const map = memoryFile?.sourcemapPath
    ? bundledDev.memoryFiles.get(memoryFile.sourcemapPath)?.source.toString()
    : undefined
  const result: ViteFetchResult = {
    code: code.toString(),
    // To make sure dynamic imports resolve assets correctly.
    // (Dynamic import resolves relative urls with importer url)
    url: chunkFileName,
    id: chunkFileName,
    // The potential position on the file system.
    // We don't actually keep it there, it's virtual.
    file: normalizePath(path.resolve(outDir, chunkFileName)),
    // chunks cannot be invalidated manually
    invalidate: false,
    // TODO: seems like rolldown uses `process.cwd()` instead of `config.root`
    // We need this because __rolldown_runtime__ keeps modules internally
    // And after HMR there is no other way to receive the updated exports
    rolldownModuleId: facadeModuleId
      ? normalizePath(path.relative(process.cwd(), facadeModuleId))
      : undefined,
  }
  // TODO: this should be done in rolldown, there is already a function for it
  // output.format = 'module-runner'
  // See https://github.com/rolldown/rolldown/issues/8376
  const ssrResult = await ssrTransform(
    result.code,
    map ? JSON.parse(map) : null,
    result.file!,
    result.code,
  )
  if (!ssrResult) {
    throw new Error(`[vite] cannot apply ssr transform to '${moduleUrl}'.`)
  }
  result.code = ssrResult.code
  if (options.inlineSourceMap !== false) {
    result.code = inlineSourceMap(
      result.id,
      ssrResult,
      options.startOffset,
    ).code
  }

  // remove shebang
  if (result.code[0] === '#')
    result.code = result.code.replace(/^#!.*/, (s) => ' '.repeat(s.length))

  return result
}

const OTHER_SOURCE_MAP_REGEXP = new RegExp(
  `//# ${SOURCEMAPPING_URL}=data:application/json[^,]+base64,[A-Za-z0-9+/=]+$`,
  'gm',
)

function inlineSourceMap(
  id: string,
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
    ? {
        ...map,
        mappings: ';'.repeat(startOffset) + map.mappings,
      }
    : map
  result.code = `${code.trimEnd()}\n//# sourceURL=${encodeSourceURL(
    id,
  )}\n${MODULE_RUNNER_SOURCEMAPPING_SOURCE}\n//# ${SOURCEMAPPING_URL}=${genSourceMapUrl(sourceMap)}\n`

  return result
}

function isBundledChunkUrl(
  environment: DevEnvironment,
  moduleRunnerUrl: string,
) {
  return environment.bundledDev?.memoryFiles.has(moduleRunnerUrl)
}

async function resolveBundledEntryFilename(
  environment: BundledDev,
  root: string,
  moduleUrl: string,
): Promise<
  [facadeModuleId: string | undefined, chunkName: string] | undefined
> {
  if (environment.memoryFiles.has(moduleUrl)) {
    return [undefined, moduleUrl]
  }
  // Already resolved to a facade ModuleID
  if (environment.facadeToChunk.has(moduleUrl)) {
    return [moduleUrl, environment.facadeToChunk.get(moduleUrl)!]
  }
  const facadeModuleId = await environment.resolveEntryFacade(moduleUrl)
  if (facadeModuleId && environment.facadeToChunk.has(facadeModuleId)) {
    return [facadeModuleId, environment.facadeToChunk.get(facadeModuleId)!]
  }
  const moduleId = normalizePath(
    moduleUrl.startsWith('file://')
      ? // new URL(path)
        fileURLToPath(moduleUrl)
      : // ./index.js
        // NOTE: we don't try to find it if extension is not passed
        // It will throw an error instead
        path.resolve(root, moduleUrl),
  )
  if (environment.facadeToChunk.get(moduleId)) {
    return [moduleId, environment.facadeToChunk.get(moduleId)!]
  }
  if (moduleUrl[0] === '/') {
    const absoluteModuleId = path.posix.join(root, moduleUrl)
    const absoluteChunk = environment.facadeToChunk.get(absoluteModuleId)
    if (absoluteChunk) {
      return [absoluteModuleId, absoluteChunk]
    }
  }
}

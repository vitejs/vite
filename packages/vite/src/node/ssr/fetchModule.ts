import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import type { FetchResult } from 'vite/module-runner'
import type { TransformResult } from '..'
import { tryNodeResolve } from '../plugins/resolve'
import {
  isBuiltin,
  isExternalUrl,
  isFilePathESM,
  normalizePath,
} from '../utils'
import { unwrapId } from '../../shared/utils'
import {
  MODULE_RUNNER_SOURCEMAPPING_SOURCE,
  SOURCEMAPPING_URL,
} from '../../shared/constants'
import { genSourceMapUrl } from '../server/sourcemap'
import type { DevEnvironment } from '../server/environment'
import { FullBundleDevEnvironment } from '../server/environments/fullBundleEnvironment'
import type { ViteFetchResult } from '../../shared/invokeMethods'
import { ssrTransform } from './ssrTransform'

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
  if (
    url.startsWith('data:') ||
    isBuiltin(environment.config.resolve.builtins, url)
  ) {
    return { externalize: url, type: 'builtin' }
  }

  // handle file urls from not statically analyzable dynamic import
  const isFileUrl = url.startsWith('file://')

  if (isExternalUrl(url) && !isFileUrl) {
    return { externalize: url, type: 'network' }
  }

  // if there is no importer, the file is an entry point
  // entry points are always internalized
  if (
    !isFileUrl &&
    importer &&
    url[0] !== '.' &&
    url[0] !== '/' &&
    !isChunkUrl(environment, url)
  ) {
    const { isProduction, root } = environment.config
    const { externalConditions, dedupe, preserveSymlinks } =
      environment.config.resolve

    const resolved = tryNodeResolve(url, importer, {
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

  url = unwrapId(url)

  if (environment instanceof FullBundleDevEnvironment) {
    await environment._waitForInitialBuildSuccess()

    const outDir = normalizePath(
      path.resolve(environment.config.root, environment.config.build.outDir),
    )

    let fileName: string

    if (!importer) {
      fileName = resolveEntryFilename(environment, url)!

      if (!fileName) {
        const entrypoints = [...environment.facadeToChunk.keys()]
        throw new Error(
          `[vite] Entrypoint '${url}' was not defined in the config. ` +
            (entrypoints.length
              ? `Available entry points: \n- ${[...environment.facadeToChunk.keys()].join('\n- ')}`
              : `The build did not produce any chunks. Did it finish successfully? See the logs for more information.`),
        )
      }
    } else if (url[0] === '.') {
      // Importer is reported as a full path on the file system.
      // This happens because we provide the `file` attribute.
      if (importer.startsWith(outDir)) {
        importer = importer.slice(outDir.length + 1)
      }

      fileName = path.posix.join(path.posix.dirname(importer), url)
    } else {
      fileName = url
    }

    const memoryFile = environment.memoryFiles.get(fileName)
    // TODO: how to check caching?
    const code = memoryFile?.source
    if (code == null) {
      throw new Error(
        `[vite] the module '${url}' (chunk '${fileName}') ${
          importer ? ` imported from '${importer}'` : ''
        } was not bundled. Is server established?`,
      )
    }

    const result: ViteFetchResult = {
      code: code.toString(),
      // To make sure dynamic imports resolve assets correctly.
      // (Dynamic import resolves relative urls with importer url)
      url: fileName,
      id: fileName,
      // The potential position on the file system.
      // We don't actually keep it there, it's virtual.
      file: normalizePath(path.resolve(outDir, fileName)),
      // TODO: how to know the file was invalidated?
      invalidate: false,
    }
    // TODO: this should be done in rolldown, there is already a function for it
    // output.format = 'module-runner'
    // See https://github.com/rolldown/rolldown/issues/8376
    const ssrResult = await ssrTransform(result.code, null, url, result.code)
    if (!ssrResult) {
      throw new Error(`[vite] cannot apply ssr transform to '${url}'.`)
    }
    result.code = ssrResult.code

    // remove shebang
    if (result.code[0] === '#')
      result.code = result.code.replace(/^#!.*/, (s) => ' '.repeat(s.length))

    return result
  }

  const mod = await environment.moduleGraph.ensureEntryFromUrl(url)
  const cached = !!mod.transformResult

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

const OTHER_SOURCE_MAP_REGEXP = new RegExp(
  `//# ${SOURCEMAPPING_URL}=data:application/json[^,]+base64,([A-Za-z0-9+/=]+)$`,
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
    ? Object.assign({}, map, {
        mappings: ';'.repeat(startOffset) + map.mappings,
      })
    : map
  result.code = `${code.trimEnd()}\n//# sourceURL=${
    id
  }\n${MODULE_RUNNER_SOURCEMAPPING_SOURCE}\n//# ${SOURCEMAPPING_URL}=${genSourceMapUrl(sourceMap)}\n`

  return result
}

function isChunkUrl(environment: DevEnvironment, url: string) {
  return (
    environment instanceof FullBundleDevEnvironment &&
    environment.memoryFiles.has(url)
  )
}

function resolveEntryFilename(
  environment: FullBundleDevEnvironment,
  url: string,
) {
  // Already resolved by the user to be a url
  if (environment.facadeToChunk.has(url)) {
    return environment.facadeToChunk.get(url)
  }
  const moduleId = normalizePath(
    url.startsWith('file://')
      ? // new URL(path)
        fileURLToPath(url)
      : // ./index.js
        // NOTE: we don't try to find it if extension is not passed
        // It will throw an error instead
        path.resolve(environment.config.root, url),
  )
  if (environment.facadeToChunk.get(moduleId)) {
    return environment.facadeToChunk.get(moduleId)
  }
  if (url[0] === '/') {
    const tryAbsouteUrl = path.posix.join(environment.config.root, url)
    return environment.facadeToChunk.get(tryAbsouteUrl)
  }
}

import path from 'node:path'
import { pathToFileURL } from 'node:url'
import colors from 'picocolors'
import type { ViteDevServer } from '../server'
import { isBuiltin, isFilePathESM, unwrapId } from '../utils'
import { transformRequest } from '../server/transformRequest'
import type { InternalResolveOptionsWithOverrideConditions } from '../plugins/resolve'
import { tryNodeResolve } from '../plugins/resolve'
import { genSourceMapUrl } from '../server/sourcemap'
import type { PackageCache } from '../packages'
import {
  ssrDynamicImportKey,
  ssrExportAllKey,
  ssrImportKey,
  ssrImportMetaKey,
  ssrModuleExportsKey,
} from './ssrTransform'
import { ssrFixStacktrace } from './ssrStacktrace'

interface SSRContext {
  global: typeof globalThis
}

type SSRModule = Record<string, any>

interface NodeImportResolveOptions
  extends InternalResolveOptionsWithOverrideConditions {
  legacyProxySsrExternalModules?: boolean
  packageCache?: PackageCache
}

interface SSRImportMetadata {
  isDynamicImport?: boolean
  /**
   * Imported names before being transformed to `ssrImportKey`
   *
   * import foo, { bar as baz, qux } from 'hello'
   * => ['default', 'bar', 'qux']
   *
   * import * as namespace from 'world
   * => undefined
   */
  importedNames?: string[]
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const AsyncFunction = async function () {}.constructor as typeof Function
let fnDeclarationLineCount = 0
{
  const body = '/*code*/'
  const source = new AsyncFunction('a', 'b', body).toString()
  fnDeclarationLineCount =
    source.slice(0, source.indexOf(body)).split('\n').length - 1
}

const pendingModules = new Map<string, Promise<SSRModule>>()
const pendingImports = new Map<string, string[]>()
const importErrors = new WeakMap<Error, { importee: string }>()

export async function ssrLoadModule(
  url: string,
  server: ViteDevServer,
  context: SSRContext = { global },
  urlStack: string[] = [],
  fixStacktrace?: boolean,
): Promise<SSRModule> {
  url = unwrapId(url)

  // when we instantiate multiple dependency modules in parallel, they may
  // point to shared modules. We need to avoid duplicate instantiation attempts
  // by register every module as pending synchronously so that all subsequent
  // request to that module are simply waiting on the same promise.
  const pending = pendingModules.get(url)
  if (pending) {
    return pending
  }

  const modulePromise = instantiateModule(
    url,
    server,
    context,
    urlStack,
    fixStacktrace,
  )
  pendingModules.set(url, modulePromise)
  modulePromise
    .catch(() => {
      pendingImports.delete(url)
    })
    .finally(() => {
      pendingModules.delete(url)
    })
  return modulePromise
}

async function instantiateModule(
  url: string,
  server: ViteDevServer,
  context: SSRContext = { global },
  urlStack: string[] = [],
  fixStacktrace?: boolean,
): Promise<SSRModule> {
  const { moduleGraph } = server
  const mod = await moduleGraph.ensureEntryFromUrl(url, true)

  if (mod.ssrError) {
    throw mod.ssrError
  }

  if (mod.ssrModule) {
    return mod.ssrModule
  }
  const result =
    mod.ssrTransformResult ||
    (await transformRequest(url, server, { ssr: true }))
  if (!result) {
    // TODO more info? is this even necessary?
    throw new Error(`failed to load module for ssr: ${url}`)
  }

  const ssrModule = {
    [Symbol.toStringTag]: 'Module',
  }
  Object.defineProperty(ssrModule, '__esModule', { value: true })

  // Tolerate circular imports by ensuring the module can be
  // referenced before it's been instantiated.
  mod.ssrModule = ssrModule

  const ssrImportMeta = {
    // The filesystem URL, matching native Node.js modules
    url: pathToFileURL(mod.file!).toString(),
  }

  urlStack = urlStack.concat(url)
  const isCircular = (url: string) => urlStack.includes(url)

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

  // Since dynamic imports can happen in parallel, we need to
  // account for multiple pending deps and duplicate imports.
  const pendingDeps: string[] = []

  const ssrImport = async (dep: string, metadata?: SSRImportMetadata) => {
    try {
      if (dep[0] !== '.' && dep[0] !== '/') {
        return await nodeImport(dep, mod.file!, resolveOptions, metadata)
      }
      // convert to rollup URL because `pendingImports`, `moduleGraph.urlToModuleMap` requires that
      dep = unwrapId(dep)
      if (!isCircular(dep) && !pendingImports.get(dep)?.some(isCircular)) {
        pendingDeps.push(dep)
        if (pendingDeps.length === 1) {
          pendingImports.set(url, pendingDeps)
        }
        const mod = await ssrLoadModule(
          dep,
          server,
          context,
          urlStack,
          fixStacktrace,
        )
        if (pendingDeps.length === 1) {
          pendingImports.delete(url)
        } else {
          pendingDeps.splice(pendingDeps.indexOf(dep), 1)
        }
        // return local module to avoid race condition #5470
        return mod
      }
      return moduleGraph.urlToModuleMap.get(dep)?.ssrModule
    } catch (err) {
      // tell external error handler which mod was imported with error
      importErrors.set(err, { importee: dep })

      throw err
    }
  }

  const ssrDynamicImport = (dep: string) => {
    // #3087 dynamic import vars is ignored at rewrite import path,
    // so here need process relative path
    if (dep[0] === '.') {
      dep = path.posix.resolve(path.dirname(url), dep)
    }
    return ssrImport(dep, { isDynamicImport: true })
  }

  function ssrExportAll(sourceModule: any) {
    for (const key in sourceModule) {
      if (key !== 'default' && key !== '__esModule') {
        Object.defineProperty(ssrModule, key, {
          enumerable: true,
          configurable: true,
          get() {
            return sourceModule[key]
          },
        })
      }
    }
  }

  let sourceMapSuffix = ''
  if (result.map && 'version' in result.map) {
    const moduleSourceMap = Object.assign({}, result.map, {
      // currently we need to offset the line
      // https://github.com/nodejs/node/issues/43047#issuecomment-1180632750
      mappings: ';'.repeat(fnDeclarationLineCount) + result.map.mappings,
    })
    sourceMapSuffix =
      '\n//# sourceMappingURL=' + genSourceMapUrl(moduleSourceMap)
  }

  try {
    const initModule = new AsyncFunction(
      `global`,
      ssrModuleExportsKey,
      ssrImportMetaKey,
      ssrImportKey,
      ssrDynamicImportKey,
      ssrExportAllKey,
      '"use strict";' +
        result.code +
        `\n//# sourceURL=${mod.id}${sourceMapSuffix}`,
    )
    await initModule(
      context.global,
      ssrModule,
      ssrImportMeta,
      ssrImport,
      ssrDynamicImport,
      ssrExportAll,
    )
  } catch (e) {
    mod.ssrError = e
    const errorData = importErrors.get(e)

    if (e.stack && fixStacktrace) {
      ssrFixStacktrace(e, moduleGraph)
    }

    server.config.logger.error(
      colors.red(
        `Error when evaluating SSR module ${url}:` +
          (errorData?.importee
            ? ` failed to import "${errorData.importee}"`
            : '') +
          `\n|- ${e.stack}\n`,
      ),
      {
        timestamp: true,
        clear: server.config.clearScreen,
        error: e,
      },
    )

    throw e
  }

  return Object.freeze(ssrModule)
}

// In node@12+ we can use dynamic import to load CJS and ESM
async function nodeImport(
  id: string,
  importer: string,
  resolveOptions: NodeImportResolveOptions,
  metadata?: SSRImportMetadata,
) {
  let url: string
  let filePath: string | undefined
  if (id.startsWith('data:') || isBuiltin(id)) {
    url = id
  } else {
    const resolved = tryNodeResolve(
      id,
      importer,
      { ...resolveOptions, tryEsmOnly: true },
      false,
      undefined,
      true,
    )
    if (!resolved) {
      const err: any = new Error(
        `Cannot find module '${id}' imported from '${importer}'`,
      )
      err.code = 'ERR_MODULE_NOT_FOUND'
      throw err
    }
    filePath = resolved.id
    url = pathToFileURL(resolved.id).toString()
  }

  const mod = await import(url)

  if (resolveOptions.legacyProxySsrExternalModules) {
    return proxyESM(mod)
  } else if (filePath) {
    analyzeImportedModDifference(
      mod,
      filePath,
      id,
      metadata,
      resolveOptions.packageCache,
    )
    return proxyGuardOnlyEsm(mod, id)
  } else {
    return mod
  }
}

// rollup-style default import interop for cjs
function proxyESM(mod: any) {
  // This is the only sensible option when the exports object is a primitive
  if (isPrimitive(mod)) return { default: mod }

  let defaultExport = 'default' in mod ? mod.default : mod

  if (!isPrimitive(defaultExport) && '__esModule' in defaultExport) {
    mod = defaultExport
    if ('default' in defaultExport) {
      defaultExport = defaultExport.default
    }
  }

  return new Proxy(mod, {
    get(mod, prop) {
      if (prop === 'default') return defaultExport
      return mod[prop] ?? defaultExport?.[prop]
    },
  })
}

function isPrimitive(value: any) {
  return !value || (typeof value !== 'object' && typeof value !== 'function')
}

/**
 * Vite converts `import { } from 'foo'` to `const _ = __vite_ssr_import__('foo')`.
 * Top-level imports and dynamic imports work slightly differently in Node.js.
 * This function normalizes the differences so it matches prod behaviour.
 */
function analyzeImportedModDifference(
  mod: any,
  filePath: string,
  rawId: string,
  metadata?: SSRImportMetadata,
  packageCache?: PackageCache,
) {
  // No normalization needed if the user already dynamic imports this module
  if (metadata?.isDynamicImport) return
  // If file path is ESM, everything should be fine
  if (isFilePathESM(filePath, packageCache)) return

  // For non-ESM, named imports is done via static analysis with cjs-module-lexer in Node.js.
  // If the user named imports a specifier that can't be analyzed, error.
  if (metadata?.importedNames?.length) {
    const missingBindings = metadata.importedNames.filter((s) => !(s in mod))
    if (missingBindings.length) {
      const lastBinding = missingBindings[missingBindings.length - 1]
      // Copied from Node.js
      throw new SyntaxError(`\
[vite] Named export '${lastBinding}' not found. The requested module '${rawId}' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from '${rawId}';
const {${missingBindings.join(', ')}} = pkg;
`)
    }
  }
}

/**
 * Guard invalid named exports only, similar to how Node.js errors for top-level imports.
 * But since we transform as dynamic imports, we need to emulate the error manually.
 */
function proxyGuardOnlyEsm(
  mod: any,
  rawId: string,
  metadata?: SSRImportMetadata,
) {
  // If the module doesn't import anything explicitly, e.g. `import 'foo'` or
  // `import * as foo from 'foo'`, we can skip the proxy guard.
  if (!metadata?.importedNames?.length) return mod

  return new Proxy(mod, {
    get(mod, prop) {
      if (prop !== 'then' && !(prop in mod)) {
        throw new SyntaxError(
          `[vite] The requested module '${rawId}' does not provide an export named '${prop.toString()}'`,
        )
      }
      return mod[prop]
    },
  })
}

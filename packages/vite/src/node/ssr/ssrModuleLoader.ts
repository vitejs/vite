import path from 'path'
import { pathToFileURL } from 'url'
import type { ViteDevServer } from '../server'
import {
  bareImportRE,
  dynamicImport,
  isBuiltin,
  unwrapId,
  usingDynamicImport
} from '../utils'
import { transformRequest } from '../server/transformRequest'
import type { InternalResolveOptions } from '../plugins/resolve'
import { tryNodeResolve } from '../plugins/resolve'
import { hookNodeResolve } from '../plugins/ssrRequireHook'
import { NULL_BYTE_PLACEHOLDER } from '../constants'
import {
  ssrDynamicImportKey,
  ssrExportAllKey,
  ssrImportKey,
  ssrImportMetaKey,
  ssrModuleExportsKey
} from './ssrTransform'
import { rebindErrorStacktrace, ssrRewriteStacktrace } from './ssrStacktrace'

interface SSRContext {
  global: typeof globalThis
}

type SSRModule = Record<string, any>

const pendingModules = new Map<string, Promise<SSRModule>>()
const pendingImports = new Map<string, string[]>()

export async function ssrLoadModule(
  url: string,
  server: ViteDevServer,
  context: SSRContext = { global },
  urlStack: string[] = [],
  fixStacktrace?: boolean
): Promise<SSRModule> {
  url = unwrapId(url).replace(NULL_BYTE_PLACEHOLDER, '\0')

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
    fixStacktrace
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
  fixStacktrace?: boolean
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
    [Symbol.toStringTag]: 'Module'
  }
  Object.defineProperty(ssrModule, '__esModule', { value: true })

  // Tolerate circular imports by ensuring the module can be
  // referenced before it's been instantiated.
  mod.ssrModule = ssrModule

  const ssrImportMeta = {
    // The filesystem URL, matching native Node.js modules
    url: pathToFileURL(mod.file!).toString()
  }

  urlStack = urlStack.concat(url)
  const isCircular = (url: string) => urlStack.includes(url)

  const {
    isProduction,
    resolve: { dedupe, preserveSymlinks },
    root
  } = server.config

  // The `extensions` and `mainFields` options are used to ensure that
  // CommonJS modules are preferred. We want to avoid ESM->ESM imports
  // whenever possible, because `hookNodeResolve` can't intercept them.
  const resolveOptions: InternalResolveOptions = {
    dedupe,
    extensions: ['.js', '.cjs', '.json'],
    isBuild: true,
    isProduction,
    isRequire: true,
    mainFields: ['main'],
    preserveSymlinks,
    root
  }

  // Since dynamic imports can happen in parallel, we need to
  // account for multiple pending deps and duplicate imports.
  const pendingDeps: string[] = []

  const ssrImport = async (dep: string) => {
    if (dep[0] !== '.' && dep[0] !== '/') {
      return nodeImport(dep, mod.file!, resolveOptions)
    }
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
        fixStacktrace
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
  }

  const ssrDynamicImport = (dep: string) => {
    // #3087 dynamic import vars is ignored at rewrite import path,
    // so here need process relative path
    if (dep[0] === '.') {
      dep = path.posix.resolve(path.dirname(url), dep)
    }
    return ssrImport(dep)
  }

  function ssrExportAll(sourceModule: any) {
    for (const key in sourceModule) {
      if (key !== 'default') {
        Object.defineProperty(ssrModule, key, {
          enumerable: true,
          configurable: true,
          get() {
            return sourceModule[key]
          }
        })
      }
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const AsyncFunction = async function () {}.constructor as typeof Function
    const initModule = new AsyncFunction(
      `global`,
      ssrModuleExportsKey,
      ssrImportMetaKey,
      ssrImportKey,
      ssrDynamicImportKey,
      ssrExportAllKey,
      result.code + `\n//# sourceURL=${mod.url}`
    )
    await initModule(
      context.global,
      ssrModule,
      ssrImportMeta,
      ssrImport,
      ssrDynamicImport,
      ssrExportAll
    )
  } catch (e) {
    mod.ssrError = e
    if (e.stack && fixStacktrace) {
      const stacktrace = ssrRewriteStacktrace(e.stack, moduleGraph)
      rebindErrorStacktrace(e, stacktrace)
      server.config.logger.error(
        `Error when evaluating SSR module ${url}:\n${stacktrace}`,
        {
          timestamp: true,
          clear: server.config.clearScreen,
          error: e
        }
      )
    }
    throw e
  }

  return Object.freeze(ssrModule)
}

// In node@12+ we can use dynamic import to load CJS and ESM
async function nodeImport(
  id: string,
  importer: string,
  resolveOptions: InternalResolveOptions
) {
  // Node's module resolution is hi-jacked so Vite can ensure the
  // configured `resolve.dedupe` and `mode` options are respected.
  const viteResolve = (
    id: string,
    importer: string,
    options = resolveOptions
  ) => {
    const resolved = tryNodeResolve(id, importer, options, false)
    if (!resolved) {
      const err: any = new Error(
        `Cannot find module '${id}' imported from '${importer}'`
      )
      err.code = 'ERR_MODULE_NOT_FOUND'
      throw err
    }
    return resolved.id
  }

  // When an ESM module imports an ESM dependency, this hook is *not* used.
  const unhookNodeResolve = hookNodeResolve(
    (nodeResolve) => (id, parent, isMain, options) => {
      // Use the Vite resolver only for bare imports while skipping
      // any absolute paths, built-in modules and binary modules.
      if (
        !bareImportRE.test(id) ||
        path.isAbsolute(id) ||
        isBuiltin(id) ||
        id.endsWith('.node')
      ) {
        return nodeResolve(id, parent, isMain, options)
      }
      if (parent) {
        let resolved = viteResolve(id, parent.id)
        if (resolved) {
          // hookNodeResolve must use platform-specific path.normalize
          // to be compatible with dynamicImport (#6080)
          resolved = path.normalize(resolved)
        }
        return resolved
      }
      // Importing a CJS module from an ESM module. In this case, the import
      // specifier is already an absolute path, so this is a no-op.
      // Options like `resolve.dedupe` and `mode` are not respected.
      return id
    }
  )

  let url: string
  if (id.startsWith('node:') || isBuiltin(id)) {
    url = id
  } else {
    url = viteResolve(
      id,
      importer,
      // Non-external modules can import ESM-only modules, but only outside
      // of test runs, because we use Node `require` in Jest to avoid segfault.
      // @ts-expect-error
      typeof jest === 'undefined'
        ? { ...resolveOptions, tryEsmOnly: true }
        : resolveOptions
    )
    if (usingDynamicImport) {
      url = pathToFileURL(url).toString()
    }
  }

  try {
    const mod = await dynamicImport(url)
    return proxyESM(mod)
  } finally {
    unhookNodeResolve()
  }
}

// rollup-style default import interop for cjs
function proxyESM(mod: any) {
  // This is the only sensible option when the exports object is a primitve
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
    }
  })
}

function isPrimitive(value: any) {
  return !value || (typeof value !== 'object' && typeof value !== 'function')
}

import path from 'path'
import { pathToFileURL } from 'url'
import { ViteDevServer } from '../server'
import {
  dynamicImport,
  isBuiltin,
  unwrapId,
  usingDynamicImport
} from '../utils'
import { rebindErrorStacktrace, ssrRewriteStacktrace } from './ssrStacktrace'
import {
  ssrExportAllKey,
  ssrModuleExportsKey,
  ssrImportKey,
  ssrImportMetaKey,
  ssrDynamicImportKey
} from './ssrTransform'
import { transformRequest } from '../server/transformRequest'
import { InternalResolveOptions, tryNodeResolve } from '../plugins/resolve'
import { hookNodeResolve } from '../plugins/ssrRequireHook'

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
  urlStack: string[] = []
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

  const modulePromise = instantiateModule(url, server, context, urlStack)
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
  urlStack: string[] = []
): Promise<SSRModule> {
  const { moduleGraph } = server
  const mod = await moduleGraph.ensureEntryFromUrl(url)

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
    resolve: { dedupe },
    root
  } = server.config

  const resolveOptions: InternalResolveOptions = {
    conditions: ['node'],
    dedupe,
    // Prefer CommonJS modules.
    extensions: ['.js', '.mjs', '.ts', '.jsx', '.tsx', '.json'],
    isBuild: true,
    isProduction,
    // Disable "module" condition.
    isRequire: true,
    mainFields: ['main'],
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
      const mod = await ssrLoadModule(dep, server, context, urlStack)
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
  const ssrRequire = (dep: string) => {
    return require(require.resolve(dep, {
      paths: [path.dirname(mod.file!)]
    }))
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
      `require`,
      ssrModuleExportsKey,
      ssrImportMetaKey,
      ssrImportKey,
      ssrDynamicImportKey,
      ssrExportAllKey,
      result.code + `\n//# sourceURL=${mod.url}`
    )
    await initModule(
      context.global,
      ssrRequire,
      ssrModule,
      ssrImportMeta,
      ssrImport,
      ssrDynamicImport,
      ssrExportAll
    )
  } catch (e) {
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
  const viteResolve = (id: string, importer: string) => {
    const resolved = tryNodeResolve(id, importer, resolveOptions, false)
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
    (nodeResolve) => (id, parent, isMain, options) =>
      id[0] === '.' || isBuiltin(id)
        ? nodeResolve(id, parent, isMain, options)
        : viteResolve(id, parent.id)
  )

  let url: string
  // `resolve` doesn't handle `node:` builtins, so handle them directly
  if (id.startsWith('node:') || isBuiltin(id)) {
    url = id
  } else {
    url = viteResolve(id, importer)
    if (usingDynamicImport) {
      url = pathToFileURL(url).toString()
    }
  }

  try {
    const mod = await dynamicImport(url)
    return proxyESM(id, mod)
  } finally {
    unhookNodeResolve()
  }
}

// rollup-style default import interop for cjs
function proxyESM(id: string, mod: any) {
  const defaultExport = mod.__esModule
    ? mod.default
    : mod.default
    ? mod.default
    : mod
  return new Proxy(mod, {
    get(mod, prop) {
      if (prop === 'default') return defaultExport
      return mod[prop] ?? defaultExport?.[prop]
    }
  })
}

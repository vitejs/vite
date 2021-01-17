import path from 'path'
import { ViteDevServer } from '..'
import { resolveFrom } from '../utils'
import { ssrRewriteStacktrace } from './ssrStacktrace'
import {
  ssrExportAllKey,
  ssrModuleExportsKey,
  ssrImportKey,
  ssrImportMetaKey,
  ssrDynamicImportKey
} from './ssrTransform'
import { transformRequest } from '../server/transformRequest'

interface SSRContext {
  global: NodeJS.Global
}

export async function ssrLoadModule(
  url: string,
  server: ViteDevServer,
  isolated: boolean,
  context: SSRContext = { global: isolated ? Object.create(global) : global },
  urlStack: string[] = []
): Promise<Record<string, any>> {
  if (urlStack.includes(url)) {
    server.config.logger.warn(
      `Circular dependency: ${urlStack.join(' -> ')} -> ${url}`
    )
    return {}
  }

  const { moduleGraph } = server
  const mod = await moduleGraph.ensureEntryFromUrl(url)

  if (!isolated && mod.ssrModule) {
    return mod.ssrModule
  }

  const result =
    mod.ssrTransformResult ||
    (await transformRequest(url, server, { ssr: true }))
  if (!result) {
    // TODO more info? is this even necessary?
    throw new Error(`failed to load module for ssr: $${url}`)
  }

  const isExternal = (dep: string) => dep[0] !== '.' && dep[0] !== '/'

  await Promise.all(
    result.deps!.map((dep) => {
      if (!isExternal(dep)) {
        return ssrLoadModule(
          dep,
          server,
          isolated,
          context,
          urlStack.concat(url)
        )
      }
    })
  )

  const ssrModule = {
    [Symbol.toStringTag]: 'Module'
  }
  Object.defineProperty(ssrModule, '__esModule', { value: true })

  const ssrImportMeta = {
    url,
    get hot() {
      // TODO better error location
      throw new Error('import.meta.hot is not available in code targeting SSR.')
    }
  }

  const ssrImport = (dep: string) => {
    if (isExternal(dep)) {
      return nodeRequire(dep, mod.file)
    } else {
      return moduleGraph.urlToModuleMap.get(dep)?.ssrModule
    }
  }

  const ssrDynamicImport = (dep: string) => {
    if (isExternal(dep)) {
      return Promise.resolve(nodeRequire(dep, mod.file))
    } else {
      return ssrLoadModule(dep, server, isolated, context, urlStack.concat(url))
    }
  }

  function ssrExportAll(sourceModule: any) {
    for (const key in sourceModule) {
      if (key !== 'default') {
        Object.defineProperty(ssrModule, key, {
          get() {
            return sourceModule[key]
          }
        })
      }
    }
  }

  try {
    new Function(
      `global`,
      ssrModuleExportsKey,
      ssrImportMetaKey,
      ssrImportKey,
      ssrDynamicImportKey,
      ssrExportAllKey,
      result.code + `\n//# sourceURL=${mod.url}`
    )(
      context.global,
      ssrModule,
      ssrImportMeta,
      ssrImport,
      ssrDynamicImport,
      ssrExportAll
    )
  } catch (e) {
    e.stack = ssrRewriteStacktrace(e.stack, moduleGraph)
    server.config.logger.error(
      `Error when evaluating SSR module ${url}:\n${e.stack}`,
      {
        timestamp: true,
        clear: true
      }
    )
  }

  mod.ssrModule = ssrModule
  return ssrModule
}

function nodeRequire(id: string, importer: string | null) {
  const mod = importer
    ? require(resolveFrom(id, path.dirname(importer)))
    : require(id)
  // rollup-style default import interop for cjs
  return new Proxy(mod, {
    get(mod, prop) {
      if (prop === 'default') return mod
      return mod[prop]
    }
  })
}

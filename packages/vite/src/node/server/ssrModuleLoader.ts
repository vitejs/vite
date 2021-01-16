import path from 'path'
import { ViteDevServer } from '..'
import { resolveFrom } from '../utils'
import {
  ssrExportAllKey,
  ssrModuleExportsKey,
  ssrImportKey,
  ssrImportMetaKey
} from './ssrTransform'
import { transformRequest } from './transformRequest'

export async function ssrLoadModule(
  url: string,
  server: ViteDevServer
): Promise<Record<string, any>> {
  const { moduleGraph } = server
  const mod = await moduleGraph.ensureEntryFromUrl(url)
  if (mod.ssrModule) {
    return mod.ssrModule
  }

  const result = await transformRequest(url, server, { ssr: true })
  if (!result) {
    // TODO more info? is this even necessary?
    throw new Error(`failed to load module for ssr: $${url}`)
  }

  const external = server.config.ssrExternal

  await Promise.all(
    result.deps!.map((dep) => {
      if (!external?.includes(dep)) {
        return ssrLoadModule(dep, server)
      }
    })
  )

  const ssrModule = {}
  const ssrImportMeta = {
    url,
    get hot() {
      // TODO better error location
      throw new Error('import.meta.hot is not available in code targeting SSR.')
    }
  }

  const ssrImport = (dep: string) => {
    if (external?.includes(dep)) {
      return nodeRequire(dep, mod.file)
    } else {
      return moduleGraph.urlToModuleMap.get(dep)?.ssrModule
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
      ssrModuleExportsKey,
      ssrImportMetaKey,
      ssrImportKey,
      ssrExportAllKey,
      result.code
    )(ssrModule, ssrImportMeta, ssrImport, ssrExportAll)
  } catch (e) {
    // TODO source map
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

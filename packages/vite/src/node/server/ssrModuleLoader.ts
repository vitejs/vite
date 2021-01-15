import path from 'path'
import { ViteDevServer } from '..'
import { resolveFrom } from '../utils'
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

  const __import__ = (dep: string) => {
    if (external?.includes(dep)) {
      if (mod.file) {
        return require(resolveFrom(dep, path.dirname(mod.file)))
      } else {
        return require(dep)
      }
    } else {
      return moduleGraph.urlToModuleMap.get(dep)?.ssrModule
    }
  }
  const __exports__ = {}

  try {
    new Function(`__import__`, `__exports__`, result.code)(
      __import__,
      __exports__
    )
  } catch (e) {
    // console.log(e.message)
    // console.log(result.code)
    // TODO
  }

  mod.ssrModule = __exports__
  return __exports__
}

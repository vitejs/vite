import { ViteDevServer } from '..'
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

  await Promise.all(result.deps!.map((dep) => ssrLoadModule(dep, server)))

  const __import__ = (dep: string) => {
    return moduleGraph.urlToModuleMap.get(dep)?.ssrModule
  }
  const __exports__ = {}

  new Function(`__import__`, `__exports__`, result.code)(
    __import__,
    __exports__
  )

  mod.ssrModule = __exports__
  return __exports__
}

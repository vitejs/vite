import colors from 'picocolors'
import type { ModuleRunner } from 'vite/module-runner'
import type { ViteDevServer } from '../server'
import { unwrapId } from '../../shared/utils'
import { ssrFixStacktrace } from './ssrStacktrace'
import { createServerModuleRunner } from './runtime/serverModuleRunner'

type SSRModule = Record<string, any>

export async function ssrLoadModule(
  url: string,
  server: ViteDevServer,
  fixStacktrace?: boolean,
): Promise<SSRModule> {
  server._ssrCompatModuleRunner ||= createServerModuleRunner(
    server.environments.ssr,
    {
      sourcemapInterceptor: false,
      hmr: false,
    },
  )
  url = unwrapId(url)

  return instantiateModule(
    url,
    server._ssrCompatModuleRunner,
    server,
    fixStacktrace,
  )
}

async function instantiateModule(
  url: string,
  runner: ModuleRunner,
  server: ViteDevServer,
  fixStacktrace?: boolean,
): Promise<SSRModule> {
  const environment = server.environments.ssr
  const mod = await environment.moduleGraph.ensureEntryFromUrl(url)

  if (mod.ssrError) {
    throw mod.ssrError
  }

  try {
    const exports = await runner.import(url)
    mod.ssrModule = exports
    return exports
  } catch (e: any) {
    mod.ssrError = e
    if (e.stack && fixStacktrace) {
      ssrFixStacktrace(e, environment.moduleGraph)
    }

    environment.logger.error(
      colors.red(`Error when evaluating SSR module ${url}:\n|- ${e.stack}\n`),
      {
        timestamp: true,
        clear: server.config.clearScreen,
        error: e,
      },
    )

    throw e
  }
}

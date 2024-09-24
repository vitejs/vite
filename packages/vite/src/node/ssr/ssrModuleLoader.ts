import colors from 'picocolors'
import type { EvaluatedModuleNode } from 'vite/module-runner'
import { ESModulesEvaluator, ModuleRunner } from 'vite/module-runner'
import type { ViteDevServer } from '../server'
import { unwrapId } from '../../shared/utils'
import { ssrFixStacktrace } from './ssrStacktrace'

type SSRModule = Record<string, any>

export async function ssrLoadModule(
  url: string,
  server: ViteDevServer,
  fixStacktrace?: boolean,
): Promise<SSRModule> {
  server._ssrCompatModuleRunner ||= new SSRCompatModuleRunner(server)
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
    return await runner.import(url)
  } catch (e: any) {
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

class SSRCompatModuleRunner extends ModuleRunner {
  constructor(private server: ViteDevServer) {
    super(
      {
        root: server.environments.ssr.config.root,
        transport: {
          fetchModule: (id, importer, options) =>
            server.environments.ssr.fetchModule(id, importer, options),
        },
        sourcemapInterceptor: false,
        hmr: false,
      },
      new ESModulesEvaluator(),
    )
  }

  protected override async directRequest(
    url: string,
    mod: EvaluatedModuleNode,
    _callstack: string[],
  ): Promise<any> {
    const id = mod.meta && 'id' in mod.meta && mod.meta.id
    // serverId doesn't exist for external modules
    if (!id) {
      return super.directRequest(url, mod, _callstack)
    }

    const viteMod = this.server.environments.ssr.moduleGraph.getModuleById(id)

    if (!viteMod) {
      return super.directRequest(id, mod, _callstack)
    }

    try {
      const exports = await super.directRequest(id, mod, _callstack)
      viteMod.ssrModule = exports
      return exports
    } catch (err) {
      viteMod.ssrError = err
      throw err
    }
  }
}

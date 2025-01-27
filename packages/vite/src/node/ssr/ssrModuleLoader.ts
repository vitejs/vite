import colors from 'picocolors'
import type { EvaluatedModuleNode } from 'vite/module-runner'
import { ESModulesEvaluator, ModuleRunner } from 'vite/module-runner'
import type { ViteDevServer } from '../server'
import { unwrapId } from '../../shared/utils'
import type { DevEnvironment } from '../server/environment'
import type { NormalizedServerHotChannel } from '../server/hmr'
import { buildErrorMessage } from '../server/middlewares/error'
import { ssrFixStacktrace } from './ssrStacktrace'
import { createServerModuleRunnerTransport } from './runtime/serverModuleRunner'

type SSRModule = Record<string, any>

export async function ssrLoadModule(
  url: string,
  server: ViteDevServer,
  fixStacktrace?: boolean,
): Promise<SSRModule> {
  const environment = server.environments.ssr
  server._ssrCompatModuleRunner ||= new SSRCompatModuleRunner(environment)
  url = unwrapId(url)

  return instantiateModule(
    url,
    server._ssrCompatModuleRunner,
    environment,
    fixStacktrace,
  )
}

async function instantiateModule(
  url: string,
  runner: ModuleRunner,
  environment: DevEnvironment,
  fixStacktrace?: boolean,
): Promise<SSRModule> {
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
      buildErrorMessage(e, [
        colors.red(`Error when evaluating SSR module ${url}: ${e.message}`),
      ]),
      {
        timestamp: true,
        clear: environment.config.clearScreen,
        error: e,
      },
    )

    throw e
  }
}

class SSRCompatModuleRunner extends ModuleRunner {
  constructor(private environment: DevEnvironment) {
    super(
      {
        root: environment.config.root,
        transport: createServerModuleRunnerTransport({
          channel: environment.hot as NormalizedServerHotChannel,
        }),
        sourcemapInterceptor: false,
        hmr: false,
      },
      new ESModulesEvaluator(),
    )
  }

  protected override async directRequest(
    url: string,
    mod: EvaluatedModuleNode,
    callstack: string[],
  ): Promise<any> {
    const id = mod.meta && 'id' in mod.meta && mod.meta.id
    // serverId doesn't exist for external modules
    if (!id) {
      return super.directRequest(url, mod, callstack)
    }

    const viteMod = this.environment.moduleGraph.getModuleById(id)

    if (!viteMod) {
      return super.directRequest(id, mod, callstack)
    }

    try {
      const exports = await super.directRequest(id, mod, callstack)
      viteMod.ssrModule = exports
      return exports
    } catch (err) {
      viteMod.ssrError = err
      throw err
    }
  }
}

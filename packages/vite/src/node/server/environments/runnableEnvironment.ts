import type { ModuleRunner } from 'vite/module-runner'
import type { ResolvedConfig } from '../../config'
import type { ServerModuleRunnerOptions } from '../../ssr/runtime/serverModuleRunner'
import { createServerModuleRunner } from '../../ssr/runtime/serverModuleRunner'
import { createServerHotChannel } from '../hmr'
import type { Environment } from '../../environment'
import { FetchableDevEnvironment } from './fetchableEnvironments'
import type { FetchableDevEnvironmentContext } from './fetchableEnvironments'

export function createRunnableDevEnvironment(
  name: string,
  config: ResolvedConfig,
  context: RunnableDevEnvironmentContext = {},
): RunnableDevEnvironment {
  if (context.transport == null) {
    context.transport = createServerHotChannel()
  }
  if (context.hot == null) {
    context.hot = true
  }

  return new RunnableDevEnvironment(name, config, context)
}

export interface RunnableDevEnvironmentContext extends Omit<
  FetchableDevEnvironmentContext,
  'hot' | 'handleRequest'
> {
  runner?: (
    environment: RunnableDevEnvironment,
    options?: ServerModuleRunnerOptions,
  ) => ModuleRunner
  runnerOptions?: ServerModuleRunnerOptions
  hot?: boolean
  requestHandlerExport?: string
}

export function isRunnableDevEnvironment(
  environment: Environment,
): environment is RunnableDevEnvironment {
  return environment instanceof RunnableDevEnvironment
}

class RunnableDevEnvironment extends FetchableDevEnvironment {
  private _runner: ModuleRunner | undefined
  private _runnerFactory:
    | ((
        environment: RunnableDevEnvironment,
        options?: ServerModuleRunnerOptions,
      ) => ModuleRunner)
    | undefined
  private _runnerOptions: ServerModuleRunnerOptions | undefined

  constructor(
    name: string,
    config: ResolvedConfig,
    context: RunnableDevEnvironmentContext,
  ) {
    const exportName = context.requestHandlerExport ?? 'default'
    const handleRequest = async (request: Request) => {
      const url = new URL(request.url)
      const mod = await this.runner.import(url.pathname)
      return mod[exportName](request)
    }
    super(name, config, {
      ...context,
      hot: context.hot ?? false,
      handleRequest,
    })
    this._runnerFactory = context.runner
    this._runnerOptions = context.runnerOptions
  }

  get runner(): ModuleRunner {
    if (this._runner) {
      return this._runner
    }
    const factory = this._runnerFactory || createServerModuleRunner
    this._runner = factory(this, this._runnerOptions)
    return this._runner
  }

  override async close(): Promise<void> {
    await super.close()
    if (this._runner) {
      await this._runner.close()
    }
  }
}

export type { RunnableDevEnvironment }

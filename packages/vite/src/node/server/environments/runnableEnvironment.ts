import type { ModuleRunner } from 'vite/module-runner'
import type { ResolvedConfig } from '../../config'
import type { DevEnvironmentContext } from '../environment'
import { DevEnvironment } from '../environment'
import type { ServerModuleRunnerOptions } from '../../ssr/runtime/serverModuleRunner'
import { createServerModuleRunner } from '../../ssr/runtime/serverModuleRunner'
import type { HotChannel } from '../hmr'
import { createServerHotChannel } from '../hmr'
import type { Environment } from '../../environment'

export function createRunnableDevEnvironment(
  name: string,
  config: ResolvedConfig,
  context: RunnableDevEnvironmentContext = {},
): DevEnvironment {
  if (context.hot == null) {
    context.hot = createServerHotChannel()
  }

  return new RunnableDevEnvironment(name, config, context)
}

export interface RunnableDevEnvironmentContext
  extends Omit<DevEnvironmentContext, 'hot'> {
  runner?: (
    environment: RunnableDevEnvironment,
    options?: ServerModuleRunnerOptions,
  ) => ModuleRunner
  runnerOptions?: ServerModuleRunnerOptions
  hot?: false | HotChannel
}

export function isRunnableDevEnvironment(
  environment: Environment,
): environment is RunnableDevEnvironment {
  return environment instanceof RunnableDevEnvironment
}

class RunnableDevEnvironment extends DevEnvironment {
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
    super(name, config, context as DevEnvironmentContext)
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
      await this._runner.destroy()
    }
  }
}

export type { RunnableDevEnvironment }

import type { ModuleRunner } from 'vite/module-runner'
import type { ResolvedConfig } from '../../config'
import type { DevEnvironmentContext } from '../environment'
import { DevEnvironment } from '../environment'
import type {
  ServerModuleRunnerFactory,
  ServerModuleRunnerOptions,
} from '../../ssr/runtime/serverModuleRunner'
import { defineServerModuleRunnerFactory } from '../../ssr/runtime/serverModuleRunner'
import { createServerHotChannel } from '../hmr'
import type { Environment } from '../../environment'

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

export interface RunnableDevEnvironmentContext<
  E extends DevEnvironment = RunnableDevEnvironment,
> extends Omit<DevEnvironmentContext, 'hot'> {
  runner?: (environment: E, options?: ServerModuleRunnerOptions) => ModuleRunner
  runnerOptions?: ServerModuleRunnerOptions
  hot?: boolean
}

export function isRunnableDevEnvironment(
  environment: Environment,
): environment is RunnableDevEnvironment {
  return environment instanceof RunnableDevEnvironment
}

class RunnableDevEnvironment extends DevEnvironment {
  private _runner: ServerModuleRunnerFactory

  constructor(
    name: string,
    config: ResolvedConfig,
    context: RunnableDevEnvironmentContext,
  ) {
    super(name, config, context as DevEnvironmentContext)
    this._runner = defineServerModuleRunnerFactory(this, context)
  }

  get runner(): ModuleRunner {
    return this._runner.create()
  }

  override async close(): Promise<void> {
    await super.close()
    const runner = this._runner.get()
    if (runner) {
      await runner.close()
    }
  }
}

export type { RunnableDevEnvironment }

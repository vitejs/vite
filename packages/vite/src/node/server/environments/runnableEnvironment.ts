import type { ModuleRunner } from 'vite/module-runner'
import type { ResolvedConfig } from '../../config'
import type { DevEnvironmentContext } from '../environment'
import { DevEnvironment } from '../environment'
import { createServerModuleRunner } from '../../ssr/runtime/serverModuleRunner'
import { createServerHotChannel } from '../hmr'

export function createRunnableDevEnvironment(
  name: string,
  config: ResolvedConfig,
  context: RunnableDevEnvironmentContext,
): DevEnvironment {
  if (context.hot == null) {
    context.hot = createServerHotChannel()
  }

  return new RunnableDevEnvironment(name, config, context)
}

export interface RunnableDevEnvironmentContext extends DevEnvironmentContext {
  runner?: (environment: RunnableDevEnvironment) => ModuleRunner
}

export function isRunnableDevEnvironment(
  environment: DevEnvironment,
): environment is RunnableDevEnvironment {
  return environment instanceof RunnableDevEnvironment
}

class RunnableDevEnvironment extends DevEnvironment {
  public readonly runner: ModuleRunner

  constructor(
    name: string,
    config: ResolvedConfig,
    context: RunnableDevEnvironmentContext,
  ) {
    super(name, config, context)
    this.runner = context.runner
      ? context.runner(this)
      : createServerModuleRunner(this)
  }
}

export type { RunnableDevEnvironment }

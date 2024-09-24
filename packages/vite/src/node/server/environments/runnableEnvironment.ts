import type { ModuleRunner } from 'vite/module-runner'
import type { ResolvedConfig } from '../../config'
import type { DevEnvironmentContext } from '../environment'
import { DevEnvironment } from '../environment'
import { asyncFunctionDeclarationPaddingLineCount } from '../../../shared/utils'
import { createServerModuleRunner } from '../../ssr/runtime/serverModuleRunner'

export function createRunnableDevEnvironment(
  name: string,
  config: ResolvedConfig,
  context: RunnableDevEnvironmentContext,
): DevEnvironment {
  if (context.hot == null) {
    throw new Error(
      '`hot` is a required option. Either explicitly opt out of HMR by setting `hot: false` or provide a hot channel.',
    )
  }

  return new RunnableDevEnvironment(name, config, {
    ...context,
    runnerOptions: {
      processSourceMap(map) {
        // this assumes that "new AsyncFunction" is used to create the module
        return Object.assign({}, map, {
          mappings:
            ';'.repeat(asyncFunctionDeclarationPaddingLineCount) + map.mappings,
        })
      },
      ...context.runnerOptions,
    },
  })
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

  import<T = any>(url: string): Promise<T> {
    return this.runner.import<T>(url)
  }
}

export type { RunnableDevEnvironment }

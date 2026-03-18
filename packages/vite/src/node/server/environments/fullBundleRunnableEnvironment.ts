import type { OutputOptions } from 'rolldown'
import { type ModuleRunner, ssrRolldownRuntimeKey } from 'vite/module-runner'
import {
  type DevEnvironmentContext,
  type ResolvedConfig,
  type RunnableDevEnvironmentContext,
  createServerHotChannel,
} from '../../index'
import {
  ssrRolldownRuntimeCreateHotContextMethod,
  ssrRolldownRuntimeDefineMethod,
  ssrRolldownRuntimeTransport,
} from '../../../module-runner/constants'
import {
  type ServerModuleRunnerFactory,
  defineServerModuleRunnerFactory,
} from '../../ssr/runtime/serverModuleRunner'
import { FullBundleDevEnvironment } from './fullBundleEnvironment'

/** @experimental */
class FullBundleRunnableDevEnvironment extends FullBundleDevEnvironment {
  private _runner: ServerModuleRunnerFactory

  constructor(
    name: string,
    config: ResolvedConfig,
    context: RunnableDevEnvironmentContext<FullBundleRunnableDevEnvironment>,
  ) {
    super(name, config, context as DevEnvironmentContext)
    this._runner = defineServerModuleRunnerFactory(this, context)
  }

  get runner(): ModuleRunner {
    return this._runner.create()
  }

  protected override async getDevRuntimeImplementation(): Promise<string> {
    return `
  class ViteDevRuntime extends DevRuntime {
    createModuleHotContext(moduleId) {
      return ${ssrRolldownRuntimeKey}.${ssrRolldownRuntimeCreateHotContextMethod}(moduleId)
    }

    applyUpdates() {
      // noop, handled in the HMR client
    }
  }

  const wrappedSocket = {
    send(message) {
      switch (message.type) {
        case 'hmr:module-registered': {
          ${ssrRolldownRuntimeKey}.${ssrRolldownRuntimeTransport}?.send({
            type: 'custom',
            event: 'vite:module-loaded',
            // clone array as the runtime reuses the array instance
            data: { modules: message.modules.slice() },
          })
          break
        }
        default:
          throw new Error(\`Unknown message type: \${JSON.stringify(message)}\`)
      }
    },
  }

  ;${ssrRolldownRuntimeKey}.${ssrRolldownRuntimeDefineMethod}(new ViteDevRuntime(wrappedSocket))
    `
  }

  protected override getOutputOptions(): OutputOptions {
    return {
      ...super.getOutputOptions(),
      sourcemap: 'inline',
    }
  }

  override async close(): Promise<void> {
    await super.close()
    const runner = this._runner.get()
    if (runner) {
      await runner.close()
    }
  }
}

export type { FullBundleRunnableDevEnvironment }

/** @experimental */
export function createFullBundleRunnableDevEnvironment(
  name: string,
  config: ResolvedConfig,
  context: RunnableDevEnvironmentContext<FullBundleRunnableDevEnvironment> = {},
): FullBundleDevEnvironment {
  if (context.transport == null) {
    context.transport = createServerHotChannel()
  }
  if (context.hot == null) {
    context.hot = true
  }

  return new FullBundleRunnableDevEnvironment(name, config, context)
}

/** @experimental */
export function isFullBundleRunnableDevEnvironment(
  environment: unknown,
): environment is FullBundleRunnableDevEnvironment {
  return environment instanceof FullBundleRunnableDevEnvironment
}

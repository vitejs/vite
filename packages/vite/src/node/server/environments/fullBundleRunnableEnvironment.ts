import type { OutputOptions } from 'rolldown'
import { type ModuleRunner, ssrRolldownRuntimeKey } from 'vite/module-runner'
import {
  type ResolvedConfig,
  createServerHotChannel,
  createServerModuleRunner,
} from '../../index'
import { ssrRolldownRuntimeDefineMethod } from '../../../module-runner/constants'
import { FullBundleDevEnvironment } from './fullBundleEnvironment'

/** @experimental */
export class FullBundleRunnableDevEnvironment extends FullBundleDevEnvironment {
  private _runner: ModuleRunner | undefined

  constructor(name: string, config: ResolvedConfig) {
    // Since this is not yet exposed, we create hot channel here
    super(name, config, {
      hot: true,
      transport: createServerHotChannel(),
    })
  }

  get runner(): ModuleRunner {
    if (this._runner) {
      return this._runner
    }
    this._runner = createServerModuleRunner(this)
    return this._runner
  }

  protected override async getDevRuntimeImplementation(): Promise<string> {
    // TODO: this should not be in this file
    return `
  class ViteDevRuntime extends DevRuntime {
    createModuleHotContext(moduleId) {
      const ctx = __vite_ssr_import_meta__.hot
      // TODO: what is this?
      // ctx._internal = { updateStyle, removeStyle }
      return ctx
    }

    applyUpdates() {
      // noop, handled in the HMR client
    }
  }

  const wrappedSocket = {
    send(message) {
      switch (message.type) {
        case 'hmr:module-registered': {
          // TODO
          // transport.send({
          //   type: 'custom',
          //   event: 'vite:module-loaded',
          //   // clone array as the runtime reuses the array instance
          //   data: { modules: message.modules.slice() },
          // })
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
    if (this._runner) {
      await this._runner.close()
    }
  }
}

/** @experimental */
export function isFullBundleRunnableDevEnvironment(
  environment: unknown,
): environment is FullBundleRunnableDevEnvironment {
  return environment instanceof FullBundleRunnableDevEnvironment
}

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ModuleRunner } from 'vite/module-runner'
import {
  type ResolvedConfig,
  createServerHotChannel,
  createServerModuleRunner,
} from '../../index'
import { slash } from '../../../shared/utils'
import { FullBundleDevEnvironment } from './fullBundleEnvironment'

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
    // TODO: don't patch
    const importModule = this.runner.import.bind(this.runner)
    this._runner.import = async (url: string) => {
      await this.waitForInitialBuildFinish()
      const fileName = this.resolveEntryFilename(url)
      if (!fileName) {
        throw new Error(
          `[vite] Entrypoint '${url}' was not defined in the config. Available entry points: \n- ${[...this.facadeToChunk.keys()].join('\n- ')}`,
        )
      }
      return importModule(fileName)
    }
    return this._runner
  }

  private resolveEntryFilename(url: string) {
    // Already resolved by the user to be a url
    if (this.facadeToChunk.has(url)) {
      return this.facadeToChunk.get(url)
    }
    const moduleId = url.startsWith('file://')
      ? // new URL(path)
        fileURLToPath(url)
      : // ./index.js
        // NOTE: we don't try to find it if extension is not passed
        // It will throw an error instead
        slash(resolve(this.config.root, url))
    return this.facadeToChunk.get(moduleId)
  }

  protected override async getDevRuntimeImplementation(): Promise<string> {
    // TODO: this shoult not be in this file
    return `
  class ViteDevRuntime extends DevRuntime {
    override createModuleHotContext(moduleId) {
      const ctx = __vite_ssr_import_meta__.hot
      // TODO: what is this?
      // ctx._internal = { updateStyle, removeStyle }
      return ctx
    }

    override applyUpdates() {
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

  globalThis.__rolldown_runtime__ ??= new ViteDevRuntime(
    wrappedSocket,
  )
    `
  }

  override async close(): Promise<void> {
    await super.close()
    if (this._runner) {
      await this._runner.close()
    }
  }
}

import { nanoid } from 'nanoid/non-secure'
import { DevRuntime } from 'rolldown/experimental/runtime'
import type { HotPayload } from '#types/hmrPayload'
import {
  BundledDevHMRClient,
  BundledDevHMRContext,
} from '../shared/bundledDevHmrClient'
import type { HMRLogger } from '../shared/hmr'
import { createHMRHandler } from '../shared/hmrHandler'
import {
  type ModuleRunnerTransport,
  type NormalizedModuleRunnerTransport,
  normalizeModuleRunnerTransport,
} from '../shared/moduleRunnerTransport'

export interface NativeModuleRunnerOptions {
  transport: ModuleRunnerTransport
  hmr?: boolean
  hmrLogger?: HMRLogger
}

export class NativeModuleRunner {
  private closed = false
  private transport: NormalizedModuleRunnerTransport
  private hmrEnabled: boolean
  private hmrLogger: HMRLogger
  private hmrClient: BundledDevHMRClient | undefined
  private runtime!: DevRuntime
  /** Full-bundle generation this runtime loaded. A newer one needs a restart. */
  private buildId: number | undefined
  /** Latest build error received from the server, cleared by a new update. */
  private buildError: Error | undefined
  /**
   * Set when the dev server requests a full reload: we bail out expecting
   * the user to reload the runtime themselves (workerd or a process).
   */
  private fatalError: Error | undefined

  constructor(options: NativeModuleRunnerOptions) {
    this.hmrEnabled = options.hmr !== false
    this.hmrLogger = options.hmrLogger ?? {
      error: (err) => console.error('[vite]', err),
      debug: () => {},
    }
    this.transport = normalizeModuleRunnerTransport(options.transport)
    this.transport.connect?.(createHMRHandler(this.handlePayload.bind(this)))
    this.startClientSession()
  }

  async import<T = Record<string, any>>(url: string): Promise<T> {
    if (this.closed) {
      throw new Error('the module runner has been closed')
    }
    this.throwIfUnavailable()
    const moduleId = await this.transport.invoke('resolveBundledModuleId', [
      url,
    ])
    this.throwIfUnavailable()
    if (this.hmrClient && this.runtime.isExecuted(moduleId)) {
      return this.runtime.loadExports(moduleId) as T
    }
    const resolved = await this.transport.invoke('resolveBundledModuleUrl', [
      url,
    ])
    this.throwIfUnavailable()
    if (this.buildId !== undefined && this.buildId !== resolved.buildId) {
      throw this.requireRestart(
        'the dev server rebuilt the full bundle — restart the process (or ' +
          'worker) running this module runner before importing it',
      )
    }
    this.buildId = resolved.buildId
    return import(resolved.url) as Promise<T>
  }

  async close(): Promise<void> {
    this.closed = true
    await this.transport.disconnect?.()
  }

  isClosed(): boolean {
    return this.closed
  }

  private async handlePayload(payload: HotPayload): Promise<void> {
    if (this.closed) return
    switch (payload.type) {
      case 'bundled-dev-update':
        this.buildError = undefined
        this.hmrClient?.handlePush(payload)
        break
      case 'full-reload':
        // a full reload cannot be applied in-process: cached modules never
        // re-execute, so the runner cannot start over the way a browser
        // page reload does. Treat it as fatal and let the consumer restart
        // the process/worker.
        this.requireRestart(
          'the dev server requested a full reload — the bundled output can ' +
            'no longer be patched in place. Restart the process (or worker) ' +
            'running this module runner.',
        )
        break
      case 'error':
        this.buildError = new Error(payload.err.message)
        this.hmrLogger.error(this.buildError.message)
        break
      case 'custom':
        await this.hmrClient?.notifyListeners(payload.event, payload.data)
        break
      default:
        break
    }
  }

  private requireRestart(message: string): Error {
    if (!this.fatalError) {
      this.fatalError = new Error(message)
      this.hmrLogger.error(message)
    }
    return this.fatalError
  }

  private throwIfUnavailable(): void {
    if (this.fatalError) throw this.fatalError
    if (this.buildError) throw this.buildError
  }

  private startClientSession(): void {
    const clientId = nanoid()
    const transport = this.transport
    class ViteDevRuntime extends DevRuntime {
      payloadDelivered(filename: string): void {
        transport.send({
          type: 'custom',
          event: 'vite:bundled-dev:payload-delivered',
          data: { filename },
        })
      }
    }
    const runtime = new ViteDevRuntime(clientId)
    this.runtime = runtime
    ;(globalThis as any).__rolldown_runtime__ = runtime
    if (this.hmrEnabled) {
      const hmrClient = new BundledDevHMRClient(
        this.hmrLogger,
        this.transport,
        runtime,
        {
          // the payload's url is already an importable url — the server
          // knows this client imports patches from disk
          loadPatch: (url) => import(url),
          beforeApply: () => 'continue',
        },
      )
      runtime.hooks = {
        createModuleHotContext: (id) => new BundledDevHMRContext(hmrClient, id),
        onModuleCacheRemoval: (id) => hmrClient.handleModuleCacheRemoval(id),
      }
      this.hmrClient = hmrClient
      // registers this runner with the dev engine so it gets its own
      // per-client HMR session and ship map
      this.transport.send({
        type: 'custom',
        event: 'vite:client-connected',
        data: { clientId },
      })
    } else {
      // HMR is not applied. A stale full-output rebuild requires a new runner,
      // and until then imported modules receive a stub hot context.
      runtime.hooks = {
        createModuleHotContext: () => ({
          data: {},
          accept: () => {},
          acceptExports: () => {},
          dispose: () => {},
          prune: () => {},
          invalidate: () => {},
          on: () => {},
          off: () => {},
          send: () => {},
        }),
        onModuleCacheRemoval: () => {},
      }
    }
  }
}

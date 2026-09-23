import { nanoid } from 'nanoid/non-secure'
import { DevRuntime } from 'rolldown/experimental/runtime'
import {
  BundledDevHMRClient,
  BundledDevHMRContext,
} from './bundledDevHmrClient'
import {
  base,
  clearOverlayOrReloadOnFirstUpdate,
  registerBundledDevClient,
  removeStyle,
  transport,
  updateStyle,
} from './client'

// Replaced with the rolldown version this client was built against when the
// file is served, see `getHmrImplementation` in `node/plugins/clientInjections.ts`.
declare const __VITE_BUNDLED_ROLLDOWN_VERSION__: string

// keep the same public exports as `client.ts`, which this entry replaces when inlined
export {
  createHotContext,
  injectQuery,
  removeStyle,
  updateStyle,
  ErrorOverlay,
} from './client'

if (typeof DevRuntime !== 'undefined') {
  class ViteDevRuntime extends DevRuntime {
    payloadDelivered(filename: string): void {
      transport.send({
        type: 'custom',
        event: 'vite:bundled-dev:payload-delivered',
        data: { filename },
      })
    }

    override createModuleHotContext(moduleId: string) {
      const ctx = new BundledDevHMRContext(bundledDevHmrClient, moduleId)
      // @ts-expect-error TODO: support CSS properly
      ctx._internal = { updateStyle, removeStyle }
      return ctx
    }
  }

  const clientId = nanoid()

  transport.send({
    type: 'custom',
    event: 'vite:client-connected',
    data: { clientId },
  })

  const runtime = ((globalThis as any).__rolldown_runtime__ ??=
    new ViteDevRuntime(clientId))

  ;(runtime as any).bundledRolldownVersion = __VITE_BUNDLED_ROLLDOWN_VERSION__

  const bundledDevHmrClient = new BundledDevHMRClient(
    {
      error: (err) => console.error('[vite]', err),
      debug: (...msg) => console.debug('[vite]', ...msg),
    },
    transport,
    runtime,
    {
      base,
      beforeApply: clearOverlayOrReloadOnFirstUpdate,
    },
  )
  registerBundledDevClient(bundledDevHmrClient)

  runtime.hooks = {
    createModuleHotContext: (id: string) => runtime.createModuleHotContext(id),
    onModuleCacheRemoval: (id: string) =>
      bundledDevHmrClient.handleModuleCacheRemoval(id),
  }
}

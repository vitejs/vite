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
  transport,
} from './client'
import { logPrefix } from './logPrefix'

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
      return new BundledDevHMRContext(bundledDevHmrClient, moduleId)
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

  const bundledDevHmrClient = new BundledDevHMRClient(
    {
      error: (err) => console.error(logPrefix, err),
      debug: (...msg) => console.debug(logPrefix, ...msg),
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

import { nanoid } from 'nanoid/non-secure'
import type { DevRuntime as DevRuntimeType } from 'rolldown/experimental/runtime-types'
import {
  BundledDevHMRClient,
  BundledDevHMRContext,
} from './bundledDevHmrClient'
import {
  base,
  clearOverlayOrReloadOnFirstUpdate,
  pageReload,
  registerBundledDevClient,
  removeStyle,
  transport,
  updateStyle,
} from './client'

// keep the same public exports as `client.ts`, which this entry replaces when inlined
export {
  createHotContext,
  injectQuery,
  removeStyle,
  updateStyle,
  ErrorOverlay,
} from './client'

// injected by rolldown's hmr plugin into the bundle prelude, ahead of this client
declare const DevRuntime: typeof DevRuntimeType

if (typeof DevRuntime !== 'undefined') {
  class ViteDevRuntime extends DevRuntime {
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
      pageReload,
    },
  )
  registerBundledDevClient(bundledDevHmrClient)

  runtime.hooks = {
    createModuleHotContext: (id: string) => runtime.createModuleHotContext(id),
    onModuleCacheRemoval: (id: string) =>
      bundledDevHmrClient.handleModuleCacheRemoval(id),
  }
}

import { nanoid } from 'nanoid/non-secure'
import type { DevRuntime as DevRuntimeType } from 'rolldown/experimental/runtime-types'
import { FbmHMRClient, FbmHMRContext } from './fbmHmrClient'
import {
  base,
  clearOverlayOrReloadOnFirstUpdate,
  pageReload,
  registerFbmClient,
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
      const ctx = new FbmHMRContext(fbmHmrClient, moduleId)
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

  const fbmHmrClient = new FbmHMRClient(
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
  registerFbmClient(fbmHmrClient)

  runtime.hooks = {
    createModuleHotContext: (id: string) => runtime.createModuleHotContext(id),
    onModuleCacheRemoval: (id: string) =>
      fbmHmrClient.handleModuleCacheRemoval(id),
  }
}

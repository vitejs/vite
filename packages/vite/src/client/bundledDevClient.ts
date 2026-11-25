import { nanoid } from 'nanoid/non-secure'
import { DevRuntime } from 'rolldown/experimental/runtime'
import {
  BundledDevHMRClient,
  BundledDevHMRContext,
} from '../shared/bundledDevHmr'
import {
  BUNDLED_DEV_GENERATION_META_NAME,
  BUNDLED_DEV_HMR_PATCH_FILENAME,
} from '../shared/constants'
import {
  base,
  clearOverlayOrReloadOnFirstUpdate,
  registerBundledDevClient,
  transport,
} from './client'

declare const __HMR_PARTIAL_ACCEPT__: boolean

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
    // unknown until the generation of the output is read below
    override knownGen = -1

    override createModuleHotContext(moduleId: string) {
      return new BundledDevHMRContext(bundledDevHmrClient, moduleId)
    }

    override patchUrl(query: string): string {
      return `${base}${BUNDLED_DEV_HMR_PATCH_FILENAME}?${query}`
    }

    override lazyUrl(proxyModuleId: string, query: string): string {
      return `${base}@vite/lazy?id=${encodeURIComponent(proxyModuleId)}&${query}`
    }
  }

  // only used by the server to send this page a full reload
  const clientId = nanoid()

  transport.send({
    type: 'custom',
    event: 'vite:client-connected',
    data: { clientId },
  })

  const runtime = ((globalThis as any).__rolldown_runtime__ ??=
    new ViteDevRuntime(clientId))
  // Vite puts the generation of the output in the HTML it serves. A page whose
  // HTML comes from elsewhere (backend integration) does not know it: its
  // requests leave out `g`, and the server fills in the generation of the
  // output it serves.
  const generation =
    typeof document !== 'undefined'
      ? document
          .querySelector(`meta[name="${BUNDLED_DEV_GENERATION_META_NAME}"]`)
          ?.getAttribute('content')
      : undefined
  if (generation) {
    runtime.setOutputGeneration(Number(generation))
  }

  const bundledDevHmrClient = new BundledDevHMRClient(
    {
      error: (err) => console.error('[vite]', err),
      debug: (...msg) => console.debug('[vite]', ...msg),
    },
    transport,
    runtime,
    {
      partialAccept: __HMR_PARTIAL_ACCEPT__,
      beforeApply: clearOverlayOrReloadOnFirstUpdate,
    },
  )
  registerBundledDevClient(bundledDevHmrClient)
  // This script runs before the chunk scripts, so a push can come before the
  // output ran. Module scripts run before `DOMContentLoaded`.
  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => bundledDevHmrClient.catchUpMissedUpdates(),
      { once: true },
    )
  }

  runtime.hooks = {
    createModuleHotContext: (id: string) => runtime.createModuleHotContext(id),
    onModuleCacheRemoval: (id: string) =>
      bundledDevHmrClient.handleModuleCacheRemoval(id),
    onMissingFactory: (id: string) =>
      bundledDevHmrClient.handleMissingFactory(id),
    onReloadNeeded: (reason: string) =>
      bundledDevHmrClient.handleReloadNeeded(reason),
    onCaughtUp: () => bundledDevHmrClient.catchUpMissedUpdates(),
  }
}

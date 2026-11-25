import { nanoid } from 'nanoid/non-secure'
import { DevRuntime } from 'rolldown/experimental/runtime'
import {
  BundledDevHMRClient,
  BundledDevHMRContext,
} from '../shared/bundledDevHmr'
import {
  BUNDLED_DEV_GENERATION_META_NAME,
  BUNDLED_DEV_HMR_HAVE_PATH,
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

    // `fetch` resolves a path against the page, and `import()` against this
    // module. With `server.origin`, the page comes from another server, so the
    // path is resolved against this module, which Vite serves.
    override haveUrl(): string {
      return new URL(`${base}${BUNDLED_DEV_HMR_HAVE_PATH}`, import.meta.url)
        .href
    }
  }

  // registers this page: the server sends HMR pushes (with a `seq` per
  // connection), build errors and the reloads it asks for only to registered
  // clients
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
  // This module script runs after parsing ('interactive'), before the chunk
  // scripts, so a push can come before the output ran. `DOMContentLoaded`
  // fires after all module scripts ran.
  if (typeof document !== 'undefined' && document.readyState !== 'complete') {
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

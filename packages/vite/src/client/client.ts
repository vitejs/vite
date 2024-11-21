import type { ErrorPayload, HotPayload } from 'types/hmrPayload'
import type { ViteHotContext } from 'types/hot'
import type { InferCustomEventPayload } from 'types/customEvent'
import { HMRClient, HMRContext } from '../shared/hmr'
import {
  createWebSocketModuleRunnerTransport,
  normalizeModuleRunnerTransport,
} from '../shared/moduleRunnerTransport'
import { ErrorOverlay, overlayId } from './overlay'
import '@vite/env'

// injected by the hmr plugin when served
declare const __BASE__: string
declare const __SERVER_HOST__: string
declare const __HMR_PROTOCOL__: string | null
declare const __HMR_HOSTNAME__: string | null
declare const __HMR_PORT__: number | null
declare const __HMR_DIRECT_TARGET__: string
declare const __HMR_BASE__: string
declare const __HMR_TIMEOUT__: number
declare const __HMR_ENABLE_OVERLAY__: boolean

console.debug('[vite] connecting...')

const importMetaUrl = new URL(import.meta.url)

// use server configuration, then fallback to inference
const serverHost = __SERVER_HOST__
const socketProtocol =
  __HMR_PROTOCOL__ || (importMetaUrl.protocol === 'https:' ? 'wss' : 'ws')
const hmrPort = __HMR_PORT__
const socketHost = `${__HMR_HOSTNAME__ || importMetaUrl.hostname}:${
  hmrPort || importMetaUrl.port
}${__HMR_BASE__}`
const directSocketHost = __HMR_DIRECT_TARGET__
const base = __BASE__ || '/'
const hmrTimeout = __HMR_TIMEOUT__

const transport = normalizeModuleRunnerTransport(
  (() => {
    let wsTransport = createWebSocketModuleRunnerTransport({
      createConnection: () =>
        new WebSocket(`${socketProtocol}://${socketHost}`, 'vite-hmr'),
      pingInterval: hmrTimeout,
    })

    return {
      async connect(handlers) {
        try {
          await wsTransport.connect(handlers)
        } catch (e) {
          // only use fallback when port is inferred and was not connected before to prevent confusion
          if (!hmrPort) {
            wsTransport = createWebSocketModuleRunnerTransport({
              createConnection: () =>
                new WebSocket(
                  `${socketProtocol}://${directSocketHost}`,
                  'vite-hmr',
                ),
              pingInterval: hmrTimeout,
            })
            try {
              await wsTransport.connect(handlers)
              console.info(
                '[vite] Direct websocket connection fallback. Check out https://vite.dev/config/server-options.html#server-hmr to remove the previous connection error.',
              )
            } catch (e) {
              if (
                e instanceof Error &&
                e.message.includes('WebSocket closed without opened.')
              ) {
                const currentScriptHostURL = new URL(import.meta.url)
                const currentScriptHost =
                  currentScriptHostURL.host +
                  currentScriptHostURL.pathname.replace(/@vite\/client$/, '')
                console.error(
                  '[vite] failed to connect to websocket.\n' +
                    'your current setup:\n' +
                    `  (browser) ${currentScriptHost} <--[HTTP]--> ${serverHost} (server)\n` +
                    `  (browser) ${socketHost} <--[WebSocket (failing)]--> ${directSocketHost} (server)\n` +
                    'Check out your Vite / network configuration and https://vite.dev/config/server-options.html#server-hmr .',
                )
              }
            }
            return
          }
          console.error(`[vite] failed to connect to websocket (${e}). `)
          throw e
        }
      },
      async disconnect() {
        await wsTransport.disconnect()
      },
      send(data) {
        wsTransport.send(data)
      },
    }
  })(),
)

let willUnload = false
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    willUnload = true
  })
}

function cleanUrl(pathname: string): string {
  const url = new URL(pathname, 'http://vite.dev')
  url.searchParams.delete('direct')
  return url.pathname + url.search
}

let isFirstUpdate = true
const outdatedLinkTags = new WeakSet<HTMLLinkElement>()

const debounceReload = (time: number) => {
  let timer: ReturnType<typeof setTimeout> | null
  return () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    timer = setTimeout(() => {
      location.reload()
    }, time)
  }
}
const pageReload = debounceReload(50)

const hmrClient = new HMRClient(
  {
    error: (err) => console.error('[vite]', err),
    debug: (...msg) => console.debug('[vite]', ...msg),
  },
  transport,
  async function importUpdatedModule({
    acceptedPath,
    timestamp,
    explicitImportRequired,
    isWithinCircularImport,
  }) {
    const [acceptedPathWithoutQuery, query] = acceptedPath.split(`?`)
    const importPromise = import(
      /* @vite-ignore */
      base +
        acceptedPathWithoutQuery.slice(1) +
        `?${explicitImportRequired ? 'import&' : ''}t=${timestamp}${
          query ? `&${query}` : ''
        }`
    )
    if (isWithinCircularImport) {
      importPromise.catch(() => {
        console.info(
          `[hmr] ${acceptedPath} failed to apply HMR as it's within a circular import. Reloading page to reset the execution order. ` +
            `To debug and break the circular import, you can run \`vite --debug hmr\` to log the circular dependency path if a file change triggered it.`,
        )
        pageReload()
      })
    }
    return await importPromise
  },
)
transport.connect!(handleMessage)

async function handleMessage(payload: HotPayload) {
  switch (payload.type) {
    case 'connected':
      console.debug(`[vite] connected.`)
      break
    case 'update':
      notifyListeners('vite:beforeUpdate', payload)
      if (hasDocument) {
        // if this is the first update and there's already an error overlay, it
        // means the page opened with existing server compile error and the whole
        // module script failed to load (since one of the nested imports is 500).
        // in this case a normal update won't work and a full reload is needed.
        if (isFirstUpdate && hasErrorOverlay()) {
          location.reload()
          return
        } else {
          if (enableOverlay) {
            clearErrorOverlay()
          }
          isFirstUpdate = false
        }
      }
      await Promise.all(
        payload.updates.map(async (update): Promise<void> => {
          if (update.type === 'js-update') {
            return hmrClient.queueUpdate(update)
          }

          // css-update
          // this is only sent when a css file referenced with <link> is updated
          const { path, timestamp } = update
          const searchUrl = cleanUrl(path)
          // can't use querySelector with `[href*=]` here since the link may be
          // using relative paths so we need to use link.href to grab the full
          // URL for the include check.
          const el = Array.from(
            document.querySelectorAll<HTMLLinkElement>('link'),
          ).find(
            (e) =>
              !outdatedLinkTags.has(e) && cleanUrl(e.href).includes(searchUrl),
          )

          if (!el) {
            return
          }

          const newPath = `${base}${searchUrl.slice(1)}${
            searchUrl.includes('?') ? '&' : '?'
          }t=${timestamp}`

          // rather than swapping the href on the existing tag, we will
          // create a new link tag. Once the new stylesheet has loaded we
          // will remove the existing link tag. This removes a Flash Of
          // Unstyled Content that can occur when swapping out the tag href
          // directly, as the new stylesheet has not yet been loaded.
          return new Promise((resolve) => {
            const newLinkTag = el.cloneNode() as HTMLLinkElement
            newLinkTag.href = new URL(newPath, el.href).href
            const removeOldEl = () => {
              el.remove()
              console.debug(`[vite] css hot updated: ${searchUrl}`)
              resolve()
            }
            newLinkTag.addEventListener('load', removeOldEl)
            newLinkTag.addEventListener('error', removeOldEl)
            outdatedLinkTags.add(el)
            el.after(newLinkTag)
          })
        }),
      )
      notifyListeners('vite:afterUpdate', payload)
      break
    case 'custom': {
      notifyListeners(payload.event, payload.data)
      if (payload.event === 'vite:ws:disconnect') {
        if (hasDocument && !willUnload) {
          console.log(`[vite] server connection lost. Polling for restart...`)
          const socket = payload.data.webSocket as WebSocket
          await waitForSuccessfulPing(socket.url)
          location.reload()
        }
      }
      break
    }
    case 'full-reload':
      notifyListeners('vite:beforeFullReload', payload)
      if (hasDocument) {
        if (payload.path && payload.path.endsWith('.html')) {
          // if html file is edited, only reload the page if the browser is
          // currently on that page.
          const pagePath = decodeURI(location.pathname)
          const payloadPath = base + payload.path.slice(1)
          if (
            pagePath === payloadPath ||
            payload.path === '/index.html' ||
            (pagePath.endsWith('/') && pagePath + 'index.html' === payloadPath)
          ) {
            pageReload()
          }
          return
        } else {
          pageReload()
        }
      }
      break
    case 'prune':
      notifyListeners('vite:beforePrune', payload)
      await hmrClient.prunePaths(payload.paths)
      break
    case 'error': {
      notifyListeners('vite:error', payload)
      if (hasDocument) {
        const err = payload.err
        if (enableOverlay) {
          createErrorOverlay(err)
        } else {
          console.error(
            `[vite] Internal Server Error\n${err.message}\n${err.stack}`,
          )
        }
      }
      break
    }
    case 'ping': // noop
      break
    default: {
      const check: never = payload
      return check
    }
  }
}

function notifyListeners<T extends string>(
  event: T,
  data: InferCustomEventPayload<T>,
): void
function notifyListeners(event: string, data: any): void {
  hmrClient.notifyListeners(event, data)
}

const enableOverlay = __HMR_ENABLE_OVERLAY__
const hasDocument = 'document' in globalThis

function createErrorOverlay(err: ErrorPayload['err']) {
  clearErrorOverlay()
  const { customElements } = globalThis
  if (customElements) {
    const ErrorOverlayConstructor = customElements.get(overlayId)!
    document.body.appendChild(new ErrorOverlayConstructor(err))
  }
}

function clearErrorOverlay() {
  document.querySelectorAll<ErrorOverlay>(overlayId).forEach((n) => n.close())
}

function hasErrorOverlay() {
  return document.querySelectorAll(overlayId).length
}

async function waitForSuccessfulPing(socketUrl: string, ms = 1000) {
  async function ping() {
    const socket = new WebSocket(socketUrl, 'vite-ping')
    return new Promise<boolean>((resolve) => {
      function onOpen() {
        resolve(true)
        close()
      }
      function onError() {
        resolve(false)
        close()
      }
      function close() {
        socket.removeEventListener('open', onOpen)
        socket.removeEventListener('error', onError)
        socket.close()
      }
      socket.addEventListener('open', onOpen)
      socket.addEventListener('error', onError)
    })
  }

  if (await ping()) {
    return
  }
  await wait(ms)

  while (true) {
    if (document.visibilityState === 'visible') {
      if (await ping()) {
        break
      }
      await wait(ms)
    } else {
      await waitForWindowShow()
    }
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitForWindowShow() {
  return new Promise<void>((resolve) => {
    const onChange = async () => {
      if (document.visibilityState === 'visible') {
        resolve()
        document.removeEventListener('visibilitychange', onChange)
      }
    }
    document.addEventListener('visibilitychange', onChange)
  })
}

const sheetsMap = new Map<string, HTMLStyleElement>()

// collect existing style elements that may have been inserted during SSR
// to avoid FOUC or duplicate styles
if ('document' in globalThis) {
  document
    .querySelectorAll<HTMLStyleElement>('style[data-vite-dev-id]')
    .forEach((el) => {
      sheetsMap.set(el.getAttribute('data-vite-dev-id')!, el)
    })
}

const cspNonce =
  'document' in globalThis
    ? document.querySelector<HTMLMetaElement>('meta[property=csp-nonce]')?.nonce
    : undefined

// all css imports should be inserted at the same position
// because after build it will be a single css file
let lastInsertedStyle: HTMLStyleElement | undefined

export function updateStyle(id: string, content: string): void {
  let style = sheetsMap.get(id)
  if (!style) {
    style = document.createElement('style')
    style.setAttribute('type', 'text/css')
    style.setAttribute('data-vite-dev-id', id)
    style.textContent = content
    if (cspNonce) {
      style.setAttribute('nonce', cspNonce)
    }

    if (!lastInsertedStyle) {
      document.head.appendChild(style)

      // reset lastInsertedStyle after async
      // because dynamically imported css will be splitted into a different file
      setTimeout(() => {
        lastInsertedStyle = undefined
      }, 0)
    } else {
      lastInsertedStyle.insertAdjacentElement('afterend', style)
    }
    lastInsertedStyle = style
  } else {
    style.textContent = content
  }
  sheetsMap.set(id, style)
}

export function removeStyle(id: string): void {
  const style = sheetsMap.get(id)
  if (style) {
    document.head.removeChild(style)
    sheetsMap.delete(id)
  }
}

export function createHotContext(ownerPath: string): ViteHotContext {
  return new HMRContext(hmrClient, ownerPath)
}

/**
 * urls here are dynamic import() urls that couldn't be statically analyzed
 */
export function injectQuery(url: string, queryToInject: string): string {
  // skip urls that won't be handled by vite
  if (url[0] !== '.' && url[0] !== '/') {
    return url
  }

  // can't use pathname from URL since it may be relative like ../
  const pathname = url.replace(/[?#].*$/, '')
  const { search, hash } = new URL(url, 'http://vite.dev')

  return `${pathname}?${queryToInject}${search ? `&` + search.slice(1) : ''}${
    hash || ''
  }`
}

export { ErrorOverlay }

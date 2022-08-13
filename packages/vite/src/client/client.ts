import type { ErrorPayload, HMRPayload, Update } from 'types/hmrPayload'
import type { ModuleNamespace, ViteHotContext } from 'types/hot'
import type { InferCustomEventPayload } from 'types/customEvent'
import { ErrorOverlay, overlayId } from './overlay'
// eslint-disable-next-line node/no-missing-import
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
  __HMR_PROTOCOL__ || (location.protocol === 'https:' ? 'wss' : 'ws')
const hmrPort = __HMR_PORT__
const socketHost = `${__HMR_HOSTNAME__ || importMetaUrl.hostname}:${
  hmrPort || importMetaUrl.port
}${__HMR_BASE__}`
const directSocketHost = __HMR_DIRECT_TARGET__
const base = __BASE__ || '/'
const messageBuffer: string[] = []

let socket: WebSocket
try {
  let fallback: (() => void) | undefined
  // only use fallback when port is inferred to prevent confusion
  if (!hmrPort) {
    fallback = () => {
      // fallback to connecting directly to the hmr server
      // for servers which does not support proxying websocket
      socket = setupWebSocket(socketProtocol, directSocketHost, () => {
        const currentScriptHostURL = new URL(import.meta.url)
        const currentScriptHost =
          currentScriptHostURL.host +
          currentScriptHostURL.pathname.replace(/@vite\/client$/, '')
        console.error(
          '[vite] failed to connect to websocket.\n' +
            'your current setup:\n' +
            `  (browser) ${currentScriptHost} <--[HTTP]--> ${serverHost} (server)\n` +
            `  (browser) ${socketHost} <--[WebSocket (failing)]--> ${directSocketHost} (server)\n` +
            'Check out your Vite / network configuration and https://vitejs.dev/config/server-options.html#server-hmr .'
        )
      })
      socket.addEventListener(
        'open',
        () => {
          console.info(
            '[vite] Direct websocket connection fallback. Check out https://vitejs.dev/config/server-options.html#server-hmr to remove the previous connection error.'
          )
        },
        { once: true }
      )
    }
  }

  socket = setupWebSocket(socketProtocol, socketHost, fallback)
} catch (error) {
  console.error(`[vite] failed to connect to websocket (${error}). `)
}

function setupWebSocket(
  protocol: string,
  hostAndPath: string,
  onCloseWithoutOpen?: () => void
) {
  const socket = new WebSocket(`${protocol}://${hostAndPath}`, 'vite-hmr')
  let isOpened = false

  socket.addEventListener(
    'open',
    () => {
      isOpened = true
    },
    { once: true }
  )

  // Listen for messages
  socket.addEventListener('message', async ({ data }) => {
    handleMessage(JSON.parse(data))
  })

  // ping server
  socket.addEventListener('close', async ({ wasClean }) => {
    if (wasClean) return

    if (!isOpened && onCloseWithoutOpen) {
      onCloseWithoutOpen()
      return
    }

    console.log(`[vite] server connection lost. polling for restart...`)
    await waitForSuccessfulPing(protocol, hostAndPath)
    location.reload()
  })

  return socket
}

function warnFailedFetch(err: Error, path: string | string[]) {
  if (!err.message.match('fetch')) {
    console.error(err)
  }
  console.error(
    `[hmr] Failed to reload ${path}. ` +
      `This could be due to syntax errors or importing non-existent ` +
      `modules. (see errors above)`
  )
}

function cleanUrl(pathname: string): string {
  const url = new URL(pathname, location.toString())
  url.searchParams.delete('direct')
  return url.pathname + url.search
}

let isFirstUpdate = true

async function handleMessage(payload: HMRPayload) {
  switch (payload.type) {
    case 'connected':
      console.debug(`[vite] connected.`)
      sendMessageBuffer()
      // proxy(nginx, docker) hmr ws maybe caused timeout,
      // so send ping package let ws keep alive.
      setInterval(() => {
        if (socket.readyState === socket.OPEN) {
          socket.send('{"type":"ping"}')
        }
      }, __HMR_TIMEOUT__)
      break
    case 'update':
      notifyListeners('vite:beforeUpdate', payload)
      // if this is the first update and there's already an error overlay, it
      // means the page opened with existing server compile error and the whole
      // module script failed to load (since one of the nested imports is 500).
      // in this case a normal update won't work and a full reload is needed.
      if (isFirstUpdate && hasErrorOverlay()) {
        window.location.reload()
        return
      } else {
        clearErrorOverlay()
        isFirstUpdate = false
      }
      payload.updates.forEach((update) => {
        if (update.type === 'js-update') {
          queueUpdate(fetchUpdate(update))
        } else {
          // css-update
          // this is only sent when a css file referenced with <link> is updated
          const { path, timestamp } = update
          const searchUrl = cleanUrl(path)
          // can't use querySelector with `[href*=]` here since the link may be
          // using relative paths so we need to use link.href to grab the full
          // URL for the include check.
          const el = Array.from(
            document.querySelectorAll<HTMLLinkElement>('link')
          ).find((e) => cleanUrl(e.href).includes(searchUrl))
          if (el) {
            const newPath = `${base}${searchUrl.slice(1)}${
              searchUrl.includes('?') ? '&' : '?'
            }t=${timestamp}`

            // rather than swapping the href on the existing tag, we will
            // create a new link tag. Once the new stylesheet has loaded we
            // will remove the existing link tag. This removes a Flash Of
            // Unstyled Content that can occur when swapping out the tag href
            // directly, as the new stylesheet has not yet been loaded.
            const newLinkTag = el.cloneNode() as HTMLLinkElement
            newLinkTag.href = new URL(newPath, el.href).href
            const removeOldEl = () => el.remove()
            newLinkTag.addEventListener('load', removeOldEl)
            newLinkTag.addEventListener('error', removeOldEl)
            el.after(newLinkTag)
          }
          console.log(`[vite] css hot updated: ${searchUrl}`)
        }
      })
      break
    case 'custom': {
      notifyListeners(payload.event, payload.data)
      break
    }
    case 'full-reload':
      notifyListeners('vite:beforeFullReload', payload)
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
          location.reload()
        }
        return
      } else {
        location.reload()
      }
      break
    case 'prune':
      notifyListeners('vite:beforePrune', payload)
      // After an HMR update, some modules are no longer imported on the page
      // but they may have left behind side effects that need to be cleaned up
      // (.e.g style injections)
      // TODO Trigger their dispose callbacks.
      payload.paths.forEach((path) => {
        const fn = pruneMap.get(path)
        if (fn) {
          fn(dataMap.get(path))
        }
      })
      break
    case 'error': {
      notifyListeners('vite:error', payload)
      const err = payload.err
      if (enableOverlay) {
        createErrorOverlay(err)
      } else {
        console.error(
          `[vite] Internal Server Error\n${err.message}\n${err.stack}`
        )
      }
      break
    }
    default: {
      const check: never = payload
      return check
    }
  }
}

function notifyListeners<T extends string>(
  event: T,
  data: InferCustomEventPayload<T>
): void
function notifyListeners(event: string, data: any): void {
  const cbs = customListenersMap.get(event)
  if (cbs) {
    cbs.forEach((cb) => cb(data))
  }
}

const enableOverlay = __HMR_ENABLE_OVERLAY__

function createErrorOverlay(err: ErrorPayload['err']) {
  if (!enableOverlay) return
  clearErrorOverlay()
  document.body.appendChild(new ErrorOverlay(err))
}

function clearErrorOverlay() {
  document
    .querySelectorAll(overlayId)
    .forEach((n) => (n as ErrorOverlay).close())
}

function hasErrorOverlay() {
  return document.querySelectorAll(overlayId).length
}

let pending = false
let queued: Promise<(() => void) | undefined>[] = []

/**
 * buffer multiple hot updates triggered by the same src change
 * so that they are invoked in the same order they were sent.
 * (otherwise the order may be inconsistent because of the http request round trip)
 */
async function queueUpdate(p: Promise<(() => void) | undefined>) {
  queued.push(p)
  if (!pending) {
    pending = true
    await Promise.resolve()
    pending = false
    const loading = [...queued]
    queued = []
    ;(await Promise.all(loading)).forEach((fn) => fn && fn())
  }
}

async function waitForSuccessfulPing(
  socketProtocol: string,
  hostAndPath: string,
  ms = 1000
) {
  const pingHostProtocol = socketProtocol === 'wss' ? 'https' : 'http'

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      // A fetch on a websocket URL will return a successful promise with status 400,
      // but will reject a networking error.
      // When running on middleware mode, it returns status 426, and an cors error happens if mode is not no-cors
      await fetch(`${pingHostProtocol}://${hostAndPath}`, {
        mode: 'no-cors'
      })
      break
    } catch (e) {
      // wait ms before attempting to ping again
      await new Promise((resolve) => setTimeout(resolve, ms))
    }
  }
}

// https://wicg.github.io/construct-stylesheets
const supportsConstructedSheet = (() => {
  // TODO: re-enable this try block once Chrome fixes the performance of
  // rule insertion in really big stylesheets
  // try {
  //   new CSSStyleSheet()
  //   return true
  // } catch (e) {}
  return false
})()

const sheetsMap = new Map<
  string,
  HTMLStyleElement | CSSStyleSheet | undefined
>()

export function updateStyle(id: string, content: string): void {
  let style = sheetsMap.get(id)
  if (supportsConstructedSheet && !content.includes('@import')) {
    if (style && !(style instanceof CSSStyleSheet)) {
      removeStyle(id)
      style = undefined
    }

    if (!style) {
      style = new CSSStyleSheet()
      // @ts-expect-error: using experimental API
      style.replaceSync(content)
      // @ts-expect-error: using experimental API
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, style]
    } else {
      // @ts-expect-error: using experimental API
      style.replaceSync(content)
    }
  } else {
    if (style && !(style instanceof HTMLStyleElement)) {
      removeStyle(id)
      style = undefined
    }

    if (!style) {
      style = document.createElement('style')
      style.setAttribute('type', 'text/css')
      style.innerHTML = content
      document.head.appendChild(style)
    } else {
      style.innerHTML = content
    }
  }
  sheetsMap.set(id, style)
}

export function removeStyle(id: string): void {
  const style = sheetsMap.get(id)
  if (style) {
    if (style instanceof CSSStyleSheet) {
      // @ts-expect-error: using experimental API
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (s: CSSStyleSheet) => s !== style
      )
    } else {
      document.head.removeChild(style)
    }
    sheetsMap.delete(id)
  }
}

async function fetchUpdate({ path, acceptedPath, timestamp }: Update) {
  const mod = hotModulesMap.get(path)
  if (!mod) {
    // In a code-splitting project,
    // it is common that the hot-updating module is not loaded yet.
    // https://github.com/vitejs/vite/issues/721
    return
  }

  const moduleMap = new Map<string, ModuleNamespace>()
  const isSelfUpdate = path === acceptedPath

  // make sure we only import each dep once
  const modulesToUpdate = new Set<string>()
  if (isSelfUpdate) {
    // self update - only update self
    modulesToUpdate.add(path)
  } else {
    // dep update
    for (const { deps } of mod.callbacks) {
      deps.forEach((dep) => {
        if (acceptedPath === dep) {
          modulesToUpdate.add(dep)
        }
      })
    }
  }

  // determine the qualified callbacks before we re-import the modules
  const qualifiedCallbacks = mod.callbacks.filter(({ deps }) => {
    return deps.some((dep) => modulesToUpdate.has(dep))
  })

  await Promise.all(
    Array.from(modulesToUpdate).map(async (dep) => {
      const disposer = disposeMap.get(dep)
      if (disposer) await disposer(dataMap.get(dep))
      const [path, query] = dep.split(`?`)
      try {
        const newMod: ModuleNamespace = await import(
          /* @vite-ignore */
          base +
            path.slice(1) +
            `?import&t=${timestamp}${query ? `&${query}` : ''}`
        )
        moduleMap.set(dep, newMod)
      } catch (e) {
        warnFailedFetch(e, dep)
      }
    })
  )

  return () => {
    for (const { deps, fn } of qualifiedCallbacks) {
      fn(deps.map((dep) => moduleMap.get(dep)))
    }
    const loggedPath = isSelfUpdate ? path : `${acceptedPath} via ${path}`
    console.log(`[vite] hot updated: ${loggedPath}`)
  }
}

function sendMessageBuffer() {
  if (socket.readyState === 1) {
    messageBuffer.forEach((msg) => socket.send(msg))
    messageBuffer.length = 0
  }
}

interface HotModule {
  id: string
  callbacks: HotCallback[]
}

interface HotCallback {
  // the dependencies must be fetchable paths
  deps: string[]
  fn: (modules: Array<ModuleNamespace | undefined>) => void
}

type CustomListenersMap = Map<string, ((data: any) => void)[]>

const hotModulesMap = new Map<string, HotModule>()
const disposeMap = new Map<string, (data: any) => void | Promise<void>>()
const pruneMap = new Map<string, (data: any) => void | Promise<void>>()
const dataMap = new Map<string, any>()
const customListenersMap: CustomListenersMap = new Map()
const ctxToListenersMap = new Map<string, CustomListenersMap>()

export function createHotContext(ownerPath: string): ViteHotContext {
  if (!dataMap.has(ownerPath)) {
    dataMap.set(ownerPath, {})
  }

  // when a file is hot updated, a new context is created
  // clear its stale callbacks
  const mod = hotModulesMap.get(ownerPath)
  if (mod) {
    mod.callbacks = []
  }

  // clear stale custom event listeners
  const staleListeners = ctxToListenersMap.get(ownerPath)
  if (staleListeners) {
    for (const [event, staleFns] of staleListeners) {
      const listeners = customListenersMap.get(event)
      if (listeners) {
        customListenersMap.set(
          event,
          listeners.filter((l) => !staleFns.includes(l))
        )
      }
    }
  }

  const newListeners: CustomListenersMap = new Map()
  ctxToListenersMap.set(ownerPath, newListeners)

  function acceptDeps(deps: string[], callback: HotCallback['fn'] = () => {}) {
    const mod: HotModule = hotModulesMap.get(ownerPath) || {
      id: ownerPath,
      callbacks: []
    }
    mod.callbacks.push({
      deps,
      fn: callback
    })
    hotModulesMap.set(ownerPath, mod)
  }

  const hot: ViteHotContext = {
    get data() {
      return dataMap.get(ownerPath)
    },

    accept(deps?: any, callback?: any) {
      if (typeof deps === 'function' || !deps) {
        // self-accept: hot.accept(() => {})
        acceptDeps([ownerPath], ([mod]) => deps && deps(mod))
      } else if (typeof deps === 'string') {
        // explicit deps
        acceptDeps([deps], ([mod]) => callback && callback(mod))
      } else if (Array.isArray(deps)) {
        acceptDeps(deps, callback)
      } else {
        throw new Error(`invalid hot.accept() usage.`)
      }
    },

    // export names (first arg) are irrelevant on the client side, they're
    // extracted in the server for propagation
    acceptExports(_: string | readonly string[], callback?: any) {
      acceptDeps([ownerPath], callback && (([mod]) => callback(mod)))
    },

    dispose(cb) {
      disposeMap.set(ownerPath, cb)
    },

    // @ts-expect-error untyped
    prune(cb: (data: any) => void) {
      pruneMap.set(ownerPath, cb)
    },

    // TODO
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    decline() {},

    invalidate() {
      // TODO should tell the server to re-perform hmr propagation
      // from this module as root
      location.reload()
    },

    // custom events
    on(event, cb) {
      const addToMap = (map: Map<string, any[]>) => {
        const existing = map.get(event) || []
        existing.push(cb)
        map.set(event, existing)
      }
      addToMap(customListenersMap)
      addToMap(newListeners)
    },

    send(event, data) {
      messageBuffer.push(JSON.stringify({ type: 'custom', event, data }))
      sendMessageBuffer()
    }
  }

  return hot
}

/**
 * urls here are dynamic import() urls that couldn't be statically analyzed
 */
export function injectQuery(url: string, queryToInject: string): string {
  // skip urls that won't be handled by vite
  if (!url.startsWith('.') && !url.startsWith('/')) {
    return url
  }

  // can't use pathname from URL since it may be relative like ../
  const pathname = url.replace(/#.*$/, '').replace(/\?.*$/, '')
  const { search, hash } = new URL(url, 'http://vitejs.dev')

  return `${pathname}?${queryToInject}${search ? `&` + search.slice(1) : ''}${
    hash || ''
  }`
}

export { ErrorOverlay }

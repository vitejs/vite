import { ErrorPayload, HMRPayload, Update } from 'types/hmrPayload'
import { ErrorOverlay, overlayId } from './overlay'

// injected by the hmr plugin when served
declare const __ROOT__: string
declare const __MODE__: string
declare const __DEFINES__: Record<string, any>
declare const __HMR_PROTOCOL__: string
declare const __HMR_HOSTNAME__: string
declare const __HMR_PORT__: string
declare const __HMR_TIMEOUT__: number
declare const __HMR_ENABLE_OVERLAY__: boolean

  // shim process
;(window as any).process = (window as any).process || {}
;(window as any).process.env = (window as any).process.env || {}
;(window as any).process.env.NODE_ENV = __MODE__

// assign defines
const defines = __DEFINES__
Object.keys(defines).forEach((key) => {
  const segs = key.split('.')
  let target = window as any
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i]
    if (i === segs.length - 1) {
      target[seg] = defines[key]
    } else {
      target = target[seg] || (target[seg] = {})
    }
  }
})

// window.onerror = (msg, src, line, col, err) => {
//   const re = new RegExp(location.origin + '(/@fs/)?', 'g')
//   const cb = (match: string) => {
//     if (match.includes('/@fs/')) return ''
//     return __ROOT__
//   }
//   if (src) {
//     src = src.replace(re, cb)
//   }
//   createErrorOverlay({})
// }

console.log('[vite] connecting...')

// use server configuration, then fallback to inference
const socketProtocol =
  __HMR_PROTOCOL__ || (location.protocol === 'https:' ? 'wss' : 'ws')
const socketHost = `${__HMR_HOSTNAME__ || location.hostname}:${__HMR_PORT__}`
const socket = new WebSocket(`${socketProtocol}://${socketHost}`, 'vite-hmr')

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

// Listen for messages
socket.addEventListener('message', async ({ data }) => {
  handleMessage(JSON.parse(data))
})

async function handleMessage(payload: HMRPayload) {
  switch (payload.type) {
    case 'connected':
      console.log(`[vite] connected.`)
      // proxy(nginx, docker) hmr ws maybe caused timeout,
      // so send ping package let ws keep alive.
      setInterval(() => socket.send('ping'), __HMR_TIMEOUT__)
      break
    case 'update':
      clearErrorOverlay()
      payload.updates.forEach((update) => {
        if (update.type === 'js-update') {
          queueUpdate(fetchUpdate(update))
        } else {
          // css-update
          // this is only sent when a css file referened with <link> is updated
          const { path, timestamp } = update
          const el = document.querySelector(`link[href*='${path}']`)
          if (el) {
            el.setAttribute(
              'href',
              `${path}${path.includes('?') ? '&' : '?'}t=${timestamp}`
            )
          }
        }
      })
      break
    case 'css-remove':
      removeStyle(payload.path)
      break
    case 'custom':
      const cbs = customUpdateMap.get(payload.path)
      if (cbs) {
        cbs.forEach((cb) => cb(payload.customData))
      }
      break
    case 'full-reload':
      if (payload.path && payload.path.endsWith('.html')) {
        // if html file is edited, only reload the page if the browser is
        // currently on that page.
        const pagePath = location.pathname
        if (
          pagePath === payload.path ||
          (pagePath.endsWith('/') && pagePath + 'index.html' === payload.path)
        ) {
          location.reload()
        }
        return
      } else {
        location.reload()
      }
      break
    case 'error':
      const err = payload.err
      console.error(`[vite] Internal Server Error\n${err.stack}`)
      createErrorOverlay(err)
      break
    default:
      const check: never = payload
      return check
  }
}

function createErrorOverlay(err: ErrorPayload['err']) {
  if (!__HMR_ENABLE_OVERLAY__) return
  clearErrorOverlay()
  document.body.appendChild(new ErrorOverlay(err))
}

function clearErrorOverlay() {
  document
    .querySelectorAll(overlayId)
    .forEach((n) => (n as ErrorOverlay).close())
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

// ping server
socket.addEventListener('close', () => {
  console.log(`[vite] server connection lost. polling for restart...`)
  setInterval(() => {
    fetch('/')
      .then(() => {
        location.reload()
      })
      .catch((e) => {
        /* ignore */
      })
  }, 1000)
})

// https://wicg.github.io/construct-stylesheets
const supportsConstructedSheet = (() => {
  try {
    new CSSStyleSheet()
    return true
  } catch (e) {}
  return false
})()

const sheetsMap = new Map()

export function updateStyle(id: string, content: string) {
  let style = sheetsMap.get(id)
  if (supportsConstructedSheet && !content.includes('@import')) {
    if (style && !(style instanceof CSSStyleSheet)) {
      removeStyle(id)
      style = undefined
    }

    if (!style) {
      style = new CSSStyleSheet()
      style.replaceSync(content)
      // @ts-ignore
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, style]
    } else {
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

function removeStyle(id: string) {
  let style = sheetsMap.get(id)
  if (style) {
    if (style instanceof CSSStyleSheet) {
      // @ts-ignore
      const index = document.adoptedStyleSheets.indexOf(style)
      // @ts-ignore
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (s: CSSStyleSheet) => s !== style
      )
    } else {
      document.head.removeChild(style)
    }
    sheetsMap.delete(id)
  }
}

async function fetchUpdate({ path, changedPath, timestamp }: Update) {
  const mod = hotModulesMap.get(path)
  if (!mod) {
    // In a code-spliting project,
    // it is common that the hot-updating module is not loaded yet.
    // https://github.com/vitejs/vite/issues/721
    return
  }

  const moduleMap = new Map()
  const isSelfUpdate = path === changedPath

  // make sure we only import each dep once
  const modulesToUpdate = new Set<string>()
  if (isSelfUpdate) {
    // self update - only update self
    modulesToUpdate.add(path)
  } else {
    // dep update
    for (const { deps } of mod.callbacks) {
      deps.forEach((dep) => modulesToUpdate.add(dep))
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
      try {
        const newMod = await import(
          dep + (dep.includes('?') ? '&' : '?') + `t=${timestamp}`
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
    console.log(`[vite]: js module hot updated: `, path)
  }
}

interface HotModule {
  id: string
  callbacks: HotCallback[]
}

interface HotCallback {
  // the deps must be fetchable paths
  deps: string[]
  fn: (modules: object[]) => void
}

const hotModulesMap = new Map<string, HotModule>()
const disposeMap = new Map<string, (data: any) => void | Promise<void>>()
const dataMap = new Map<string, any>()
const customUpdateMap = new Map<string, ((customData: any) => void)[]>()

export const createHotContext = (ownerPath: string) => {
  if (!dataMap.has(ownerPath)) {
    dataMap.set(ownerPath, {})
  }

  // when a file is hot updated, a new context is created
  // clear its stale callbacks
  const mod = hotModulesMap.get(ownerPath)
  if (mod) {
    mod.callbacks = []
  }

  function acceptDeps(deps: string[], callback: HotCallback['fn'] = () => {}) {
    const mod: HotModule = hotModulesMap.get(ownerPath) || {
      id: ownerPath,
      callbacks: []
    }
    mod.callbacks.push({
      deps: deps.map(
        (dep) => new URL(dep, location.origin + ownerPath).pathname
      ),
      fn: callback
    })
    hotModulesMap.set(ownerPath, mod)
  }

  const hot = {
    get data() {
      return dataMap.get(ownerPath)
    },

    accept(deps: any, callback?: any) {
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

    acceptDeps() {
      throw new Error(
        `hot.acceptDeps() is deprecated. ` +
          `Use hot.accept() with the same signature instead.`
      )
    },

    dispose(cb: (data: any) => void) {
      disposeMap.set(ownerPath, cb)
    },

    // noop, used for static analysis only
    decline() {},

    invalidate() {
      location.reload()
    },

    // custom events
    on(event: string, cb: () => void) {
      const existing = customUpdateMap.get(event) || []
      existing.push(cb)
      customUpdateMap.set(event, existing)
    }
  }

  return hot
}

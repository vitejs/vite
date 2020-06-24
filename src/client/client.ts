// replaced by serverPluginHmr when served
declare const __SW_ENABLED__: boolean

// This file runs in the browser.
import { HMRRuntime } from 'vue'

// register service worker
if ('serviceWorker' in navigator) {
  ;(async () => {
    const hasExistingSw = !!navigator.serviceWorker.controller

    const prompt = (msg: string) => {
      if (confirm(msg)) {
        location.reload()
      } else {
        console.warn(msg)
      }
    }

    if (__SW_ENABLED__) {
      // if not enabled but has existing sw, registering the sw will force the
      // cache to be busted.
      try {
        navigator.serviceWorker.register('/sw.js')
      } catch (e) {
        console.log('[vite] failed to register service worker:', e)
      }
      // Notify the user to reload the page if a new service worker has taken
      // control.
      if (hasExistingSw) {
        navigator.serviceWorker.addEventListener('controllerchange', () =>
          prompt(`[vite] Service worker cache invalidated. Reload is required.`)
        )
      } else {
        console.log(`[vite] service worker registered.`)
      }
    } else if (hasExistingSw) {
      for (const reg of await navigator.serviceWorker.getRegistrations()) {
        await reg.unregister()
      }
      prompt(
        `[vite] Unregistered stale service worker. ` +
          `Reload is required to invalidate cache.`
      )
    }
  })()
}

console.log('[vite] connecting...')

declare var __VUE_HMR_RUNTIME__: HMRRuntime

const socketProtocol = location.protocol === 'https:' ? 'wss' : 'ws'
const socketUrl = `${socketProtocol}://${location.host}`
const socket = new WebSocket(socketUrl, 'vite-hmr')

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
  const { type, path, changeSrcPath, id, timestamp, customData } = JSON.parse(
    data
  )

  if (changeSrcPath) {
    await bustSwCache(changeSrcPath)
  }
  if (path !== changeSrcPath) {
    await bustSwCache(path)
  }

  switch (type) {
    case 'connected':
      console.log(`[vite] connected.`)
      break
    case 'vue-reload':
      import(`${path}?t=${timestamp}`)
        .then((m) => {
          __VUE_HMR_RUNTIME__.reload(path, m.default)
          console.log(`[vite] ${path} reloaded.`)
        })
        .catch((err) => warnFailedFetch(err, path))
      break
    case 'vue-rerender':
      const templatePath = `${path}?type=template`
      await bustSwCache(templatePath)
      import(`${templatePath}&t=${timestamp}`).then((m) => {
        __VUE_HMR_RUNTIME__.rerender(path, m.render)
        console.log(`[vite] ${path} template updated.`)
      })
      break
    case 'style-update':
      const importQuery = path.includes('?') ? '&import' : '?import'
      await bustSwCache(`${path}${importQuery}`)
      await import(`${path}${importQuery}&t=${timestamp}`)
      console.log(`[vite] ${path} updated.`)
      break
    case 'style-remove':
      removeStyle(id)
      break
    case 'js-update':
      await updateModule(path, changeSrcPath, timestamp)
      break
    case 'custom':
      const cbs = customUpdateMap.get(id)
      if (cbs) {
        cbs.forEach((cb) => cb(customData))
      }
      break
    case 'full-reload':
      if (path.endsWith('.html')) {
        // if html file is edited, only reload the page if the browser is
        // currently on that page.
        const pagePath = location.pathname
        if (
          pagePath === path ||
          (pagePath.endsWith('/') && pagePath + 'index.html' === path)
        ) {
          location.reload()
        }
        return
      } else {
        location.reload()
      }
  }
})

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

async function updateModule(
  id: string,
  changedPath: string,
  timestamp: string
) {
  const mod = hotModulesMap.get(id)
  if (!mod) {
    console.error(
      `[vite] got js update notification for "${id}" but no client callback ` +
        `was registered. Something is wrong.`
    )
    console.error(hotModulesMap)
    return
  }

  const moduleMap = new Map()
  const isSelfUpdate = id === changedPath

  // make sure we only import each dep once
  const modulesToUpdate = new Set<string>()
  if (isSelfUpdate) {
    // self update - only update self
    modulesToUpdate.add(id)
  } else {
    // dep update
    for (const { deps } of mod.callbacks) {
      if (Array.isArray(deps)) {
        deps.forEach((dep) => modulesToUpdate.add(dep))
      } else {
        modulesToUpdate.add(deps)
      }
    }
  }

  // determine the qualified callbacks before we re-import the modules
  const callbacks = mod.callbacks.filter(({ deps }) => {
    return Array.isArray(deps)
      ? deps.some((dep) => modulesToUpdate.has(dep))
      : modulesToUpdate.has(deps)
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

  for (const { deps, fn } of callbacks) {
    if (Array.isArray(deps)) {
      fn(deps.map((dep) => moduleMap.get(dep)))
    } else {
      fn(moduleMap.get(deps))
    }
  }

  console.log(`[vite]: js module hot updated: `, id)
}

interface HotModule {
  id: string
  callbacks: HotCallback[]
}

interface HotCallback {
  deps: string | string[]
  fn: (modules: object | object[]) => void
}

const hotModulesMap = new Map<string, HotModule>()
const disposeMap = new Map<string, (data: any) => void | Promise<void>>()
const dataMap = new Map<string, any>()
const customUpdateMap = new Map<string, ((customData: any) => void)[]>()

export const createHotContext = (id: string) => {
  if (!dataMap.has(id)) {
    dataMap.set(id, {})
  }

  // when a file is hot updated, a new context is created
  // clear its stale callbacks
  const mod = hotModulesMap.get(id)
  if (mod) {
    mod.callbacks = []
  }

  const hot = {
    get data() {
      return dataMap.get(id)
    },

    accept(callback: HotCallback['fn'] = () => {}) {
      hot.acceptDeps(id, callback)
    },

    acceptDeps(
      deps: HotCallback['deps'],
      callback: HotCallback['fn'] = () => {}
    ) {
      const mod: HotModule = hotModulesMap.get(id) || {
        id,
        callbacks: []
      }
      mod.callbacks.push({
        deps: deps as HotCallback['deps'],
        fn: callback
      })
      hotModulesMap.set(id, mod)
    },

    dispose(cb: (data: any) => void) {
      disposeMap.set(id, cb)
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

function bustSwCache(path: string) {
  const sw = navigator.serviceWorker && navigator.serviceWorker.controller
  if (sw) {
    return new Promise((r) => {
      const channel = new MessageChannel()
      channel.port1.onmessage = (e) => {
        if (e.data.busted) r()
      }

      sw.postMessage(
        {
          type: 'bust-cache',
          path: `${location.protocol}//${location.host}${path}`
        },
        [channel.port2]
      )
    })
  }
}

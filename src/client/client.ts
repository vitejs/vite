// This file runs in the browser.
import { HMRRuntime } from 'vue'

// register service worker
const hasExistingSw = !!navigator.serviceWorker.controller
if (__SW_ENABLED__ || hasExistingSw) {
  // if not enabled but has existing sw, registering the sw will force the
  // cache to be busted.
  navigator.serviceWorker.register('/sw.js').catch((e) => {
    console.log('[vite] failed to register service worker:', e)
  })

  // Notify the user to reload the page if a new service worker has taken
  // control.
  if (hasExistingSw) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (window.confirm('[vite] Service worker cache updated. Reload?')) {
        window.location.reload()
      }
      // in case the user dismisses it, or the prompt failed to pop because
      // the tab was inactive
      console.warn(`[vite] Service worker cache updated. A reload is required.`)
    })
  }
}

console.log('[vite] connecting...')

declare var __VUE_HMR_RUNTIME__: HMRRuntime

const socketProtocol = location.protocol === 'https:' ? 'wss' : 'ws'
const socket = new WebSocket(`${socketProtocol}://${location.host}`)

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
  const {
    type,
    path,
    changeSrcPath,
    id,
    index,
    timestamp,
    customData
  } = JSON.parse(data)

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
    case 'vue-style-update':
      const stylePath = `${path}?type=style&index=${index}`
      await bustSwCache(stylePath)
      updateStyle(id, stylePath)
      console.log(
        `[vite] ${path} style${index > 0 ? `#${index}` : ``} updated.`
      )
      break
    case 'style-update':
      updateStyle(id, `${path}?t=${timestamp}`)
      console.log(`[vite] ${path} updated.`)
      break
    case 'style-remove':
      const link = document.getElementById(`vite-css-${id}`)
      if (link) {
        document.head.removeChild(link)
      }
      break
    case 'js-update':
      const update = jsUpdateMap.get(path)
      if (update) {
        update(timestamp)
        console.log(`[vite]: js module hot updated: `, path)
      } else {
        console.error(
          `[vite] got js update notification but no client callback was registered. Something is wrong.`
        )
      }
      break
    case 'custom':
      const cbs = customUpdateMap.get(id)
      if (cbs) {
        cbs.forEach((cb) => cb(customData))
      }
      break
    case 'full-reload':
      location.reload()
  }
})

// ping server
socket.addEventListener('close', () => {
  console.log(`[vite] server connection lost. polling for restart...`)
  setInterval(() => {
    new WebSocket(`${socketProtocol}://${location.host}`).addEventListener(
      'open',
      () => {
        location.reload()
      }
    )
  }, 1000)
})

export function updateStyle(id: string, url: string) {
  const linkId = `vite-css-${id}`
  let link = document.getElementById(linkId)
  if (!link) {
    link = document.createElement('link')
    link.id = linkId
    link.setAttribute('rel', 'stylesheet')
    link.setAttribute('type', 'text/css')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

const jsUpdateMap = new Map<string, (timestamp: number) => void>()
const jsDisposeMap = new Map<string, () => void | Promise<void>>()
const customUpdateMap = new Map<string, ((customData: any) => void)[]>()

export const hot = {
  accept(
    id: string,
    deps: string | string[],
    callback: (modules: object | object[]) => void = () => {}
  ) {
    jsUpdateMap.set(id, async (timestamp: number) => {
      if (Array.isArray(deps)) {
        for (const id of deps) {
          const disposer = jsDisposeMap.get(id)
          if (disposer) await disposer()
        }
        Promise.all(deps.map((dep) => import(dep + `?t=${timestamp}`)))
          .then(callback)
          .catch((err) => warnFailedFetch(err, deps))
      } else {
        const disposer = jsDisposeMap.get(deps)
        disposer && (await disposer())
        import(deps + `?t=${timestamp}`)
          .then(callback)
          .catch((err) => warnFailedFetch(err, deps))
      }
    })
  },

  dispose(id: string, cb: () => void) {
    jsDisposeMap.set(id, cb)
  },

  on(event: string, cb: () => void) {
    const exisitng = customUpdateMap.get(event) || []
    exisitng.push(cb)
    customUpdateMap.set(event, exisitng)
  }
}

function bustSwCache(path: string) {
  const sw = navigator.serviceWorker.controller
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

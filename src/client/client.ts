// This file runs in the browser.
import { HMRRuntime } from 'vue'

console.log('[vite] connecting...')

declare var __VUE_HMR_RUNTIME__: HMRRuntime

const socketProtocol = location.protocol === 'https:' ? 'wss' : 'ws'
const socket = new WebSocket(`${socketProtocol}://${location.host}`)

// Listen for messages
socket.addEventListener('message', ({ data }) => {
  const { type, path, id, index, timestamp, customData } = JSON.parse(data)
  switch (type) {
    case 'connected':
      console.log(`[vite] connected.`)
      break
    case 'vue-reload':
      import(`${path}?t=${timestamp}`).then((m) => {
        __VUE_HMR_RUNTIME__.reload(path, m.default)
        console.log(`[vite] ${path} reloaded.`)
      })
      break
    case 'vue-rerender':
      import(`${path}?type=template&t=${timestamp}`).then((m) => {
        __VUE_HMR_RUNTIME__.rerender(path, m.render)
        console.log(`[vite] ${path} template updated.`)
      })
      break
    case 'vue-style-update':
      updateStyle(id, `${path}?type=style&index=${index}&t=${timestamp}`)
      console.log(
        `[vite] ${path} style${index > 0 ? `#${index}` : ``} updated.`
      )
      break
    case 'style-update':
      updateStyle(id, `${path}?raw&t=${timestamp}`)
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
        console.log(`[vite]: js module reloaded: `, path)
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
const customUpdateMap = new Map<string, ((customData: any) => void)[]>()

export const hot = {
  accept(
    importer: string,
    deps: string | string[],
    callback: (modules: object | object[]) => void = () => {}
  ) {
    jsUpdateMap.set(importer, (timestamp: number) => {
      if (Array.isArray(deps)) {
        Promise.all(deps.map((dep) => import(dep + `?t=${timestamp}`))).then(
          callback
        )
      } else {
        import(deps + `?t=${timestamp}`).then(callback)
      }
    })
  },

  on(event: string, cb: () => void) {
    const exisitng = customUpdateMap.get(event) || []
    exisitng.push(cb)
    customUpdateMap.set(event, exisitng)
  }
}

import { msg } from './worker-plain-dep.js'

self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage(msg)
  }
}

import { state } from './modules/test-state.js'

self.postMessage({ type: 'plugin-state-sub', data: state })

self.onmessage = (event) => {
  if (event.data === 'ping') {
    self.postMessage({ type: 'module', data: `pong ${self.location.href}` })
  }
}

// for sourcemap
console.log('sub-worker.js')

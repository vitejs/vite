let base = `/${self.location.pathname.split('/')[1]}`
if (base.endsWith('.js') || base === `/worker-entries`) base = '' // for dev

importScripts(`${base}/classic.js`)

self.onconnect = (event) => {
  const port = event.ports[0]
  port.postMessage(self.constant)
}

// for sourcemap
console.log('classic-shared-worker.js')

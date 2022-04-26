importScripts(`/${self.location.pathname.split('/')[1]}/classic.js`)

self.onconnect = (event) => {
  const port = event.ports[0]
  port.postMessage(self.constant)
}

// for sourcemap
console.log('classic-shared-worker.js')

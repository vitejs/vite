const modules = import.meta.glob('./modules/*js', { eager: true })

self.onmessage = function (e) {
  self.postMessage(Object.keys(modules))
}

// for sourcemap
console.log('importMetaGlobEager.worker.js')

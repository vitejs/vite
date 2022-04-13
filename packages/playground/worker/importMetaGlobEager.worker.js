const modules = import.meta.globEager('./modules/*js')

self.onmessage = function (e) {
  self.postMessage(Object.keys(modules))
}

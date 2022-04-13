const modules = import.meta.glob('./modules/*js')

self.onmessage = function (e) {
  self.postMessage(Object.keys(modules))
}

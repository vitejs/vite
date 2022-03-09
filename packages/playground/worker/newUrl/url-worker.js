import('./module').then((module) => {
  self.postMessage(module.default)
})

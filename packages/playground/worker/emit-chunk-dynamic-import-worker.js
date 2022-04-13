import('./modules/module0').then((module) => {
  self.postMessage(module.default + import.meta.env.BASE_URL)
})

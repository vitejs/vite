import('./modules/module').then((module) => {
  self.postMessage(module.default + import.meta.env.BASE_URL)
})

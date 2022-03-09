import('./module').then(({ msg }) => {
  self.postMessage(msg)
})

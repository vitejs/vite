(() => {
  self.addEventListener('message', () => {
    self.postMessage('classic-iife');
  })
})()

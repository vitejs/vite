self.onmessage = (event) => {
  if (event.data === 'ping') {
    self.postMessage('pong')
  }
}

Promise.all([import('./modules/module2'), import('./modules/module3')]).then(
  (data) => {
    const _data = { ...data[0], ...data[1] }
    self.postMessage(_data)
  }
)

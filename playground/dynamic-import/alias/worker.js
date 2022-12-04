self.onmessage = (event) => {
  self.postMessage({
    msg: 'load worker',
  })
}

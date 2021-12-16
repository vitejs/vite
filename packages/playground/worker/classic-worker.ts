self.onmessage = (e) => {
  if (e.data === 'ping') {
    // Ensure that we are not in a module worker (calling importScripts in module workers throws an error).
    self.importScripts()
    self.postMessage('pong')
  }
}

self.onmessage = async () => {
  const mod = await import('./dynamic')
  self.postMessage('hello from worker: ' + mod.default)
}

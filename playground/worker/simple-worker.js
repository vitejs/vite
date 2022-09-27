export let simpleWorkerMessage = 'hey there'

self.postMessage('Hello from simple worker!')

if (import.meta.hot) {
  import.meta.hot.accept((data) => {
    console.log(data)
    simpleWorkerMessage = data && data.simpleWorkerMessage
    self.postMessage(
      `Hello from simple worker (HMR message: ${simpleWorkerMessage})!`
    )
  })
}

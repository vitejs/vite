import { parentPort } from 'node:worker_threads'

if (!parentPort) {
  throw new Error('Expected parentPort to be available in node worker')
}

parentPort.on('message', (message) => {
  parentPort!.postMessage(`chunk:${message}`)
})

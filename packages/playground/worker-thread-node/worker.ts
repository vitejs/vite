import { parentPort } from 'worker_threads'

parentPort.on('message', (message) => {
  parentPort.postMessage('pong')
})

import MyWorker from './worker?worker'
import InlineWorker from './worker-inline?worker&inline'
import { Worker } from 'worker_threads'

export const run = async (message: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const worker = new MyWorker() as Worker
    worker.postMessage(message)
    worker.on('message', (msg) => {
      worker.terminate()
      resolve(msg)
    })
  })
}

export const inlineWorker = async (message: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const worker = new InlineWorker() as Worker
    worker.postMessage(message)
    worker.on('message', (msg) => {
      worker.terminate()
      resolve(msg)
    })
  })
}

if (require.main === module) {
  Promise.all([run('ping'), inlineWorker('ping')]).then(
    ([chunkResponse, inlineResponse]) => {
      console.log('Response from chunk worker - ', chunkResponse)
      console.log('Response from inline worker - ', inlineResponse)
      process.exit()
    }
  )
}

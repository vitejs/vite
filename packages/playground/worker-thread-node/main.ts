import MyWorker from './worker?worker'
import InlineWorker from './worker-inline?worker&inline'
import { Worker } from 'worker_threads'

export const run = async (message: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const worker = new MyWorker() as Worker
    worker.postMessage(message)
    worker.on('message', (msg) => {
      resolve(msg)
    })
  })
}

export const inlineWorker = async (message: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const worker = new InlineWorker() as Worker
    worker.postMessage(message)
    worker.on('message', (msg) => {
      resolve(msg)
    })
  })
}

run('ping').then((a) => {
  console.log(a)
})

inlineWorker('ping').then((a) => {
  console.log(a)
})

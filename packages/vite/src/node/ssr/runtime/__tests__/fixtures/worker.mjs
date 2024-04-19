// @ts-check

import { BroadcastChannel, parentPort } from 'node:worker_threads'
import { fileURLToPath } from 'node:url'
import { ESModulesEvaluator, ModuleRunner, RemoteRunnerTransport } from 'vite/module-runner'

if (!parentPort) {
  throw new Error('File "worker.js" must be run in a worker thread')
}

const runner = new ModuleRunner(
  {
    root: fileURLToPath(new URL('./', import.meta.url)),
    transport: new RemoteRunnerTransport({
      onMessage: listener => {
        parentPort?.on('message', listener)
      },
      send: message => {
        parentPort?.postMessage(message)
      }
    })
  },
  new ESModulesEvaluator(),
)

const channel = new BroadcastChannel('vite-worker')
channel.onmessage = async (message) => {
  try {
    const mod = await runner.import(message.data.id)
    channel.postMessage({ result: mod.default })
  } catch (e) {
    channel.postMessage({ error: e.stack })
  }
}
parentPort.postMessage('ready')
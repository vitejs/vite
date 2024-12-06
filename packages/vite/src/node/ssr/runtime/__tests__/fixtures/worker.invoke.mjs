// @ts-check

import { BroadcastChannel, parentPort } from 'node:worker_threads'
import { fileURLToPath } from 'node:url'
import { ESModulesEvaluator, ModuleRunner } from 'vite/module-runner'
import { createBirpc } from 'birpc'

if (!parentPort) {
  throw new Error('File "worker.js" must be run in a worker thread')
}

/** @type {import('worker_threads').MessagePort} */
const pPort = parentPort

/** @type {import('birpc').BirpcReturn<{ invoke: (data: any) => any }>} */
const rpc = createBirpc({}, {
  post: (data) => pPort.postMessage(data),
  on: (data) => pPort.on('message', data),
})

const runner = new ModuleRunner(
  {
    root: fileURLToPath(new URL('./', import.meta.url)),
    transport: {
      invoke(data) { return rpc.invoke(data) }
    },
    hmr: false,
  },
  new ESModulesEvaluator(),
)

const channel = new BroadcastChannel('vite-worker:invoke')
channel.onmessage = async (message) => {
  try {
    const mod = await runner.import(message.data.id)
    channel.postMessage({ result: mod.default })
  } catch (e) {
    channel.postMessage({ error: e.stack })
  }
}
parentPort.postMessage('ready')

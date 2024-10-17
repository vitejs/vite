// @ts-check

import { BroadcastChannel, parentPort } from 'node:worker_threads'
import { fileURLToPath } from 'node:url'
import { ESModulesEvaluator, ModuleRunner } from 'vite/module-runner'

if (!parentPort) {
  throw new Error('File "worker.js" must be run in a worker thread')
}

/** @type {import('worker_threads').MessagePort} */
const pPort = parentPort

/** @type {import('vite/module-runner').CreateRunnerTransport} */
const messagePortTransportOptions = ({ onDisconnection }) => {
  pPort.on('close', onDisconnection)

  return {
    connect(handler) {
      pPort.on('message', handler)
    },
    send(data) {
      pPort.postMessage(data)
    },
  }
}

const runner = new ModuleRunner(
  {
    root: fileURLToPath(new URL('./', import.meta.url)),
    createTransport: messagePortTransportOptions,
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

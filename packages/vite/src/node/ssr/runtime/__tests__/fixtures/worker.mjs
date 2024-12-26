// @ts-check

import { BroadcastChannel, parentPort } from 'node:worker_threads'
import { ESModulesEvaluator, ModuleRunner } from 'vite/module-runner'

if (!parentPort) {
  throw new Error('File "worker.js" must be run in a worker thread')
}

/** @type {import('worker_threads').MessagePort} */
const pPort = parentPort

/** @type {import('vite/module-runner').ModuleRunnerTransport} */
const messagePortTransport = {
  connect({ onMessage, onDisconnection }) {
    pPort.on('message', onMessage)
    pPort.on('close', onDisconnection)
  },
  send(data) {
    pPort.postMessage(data)
  },
}

const runner = new ModuleRunner(
  {
    transport: messagePortTransport,
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

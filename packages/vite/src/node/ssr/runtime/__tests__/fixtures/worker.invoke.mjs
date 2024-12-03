// @ts-check

import { BroadcastChannel, parentPort } from 'node:worker_threads'
import { fileURLToPath } from 'node:url'
import { ESModulesEvaluator, ModuleRunner } from 'vite/module-runner'

if (!parentPort) {
  throw new Error('File "worker.js" must be run in a worker thread')
}

/** @type {import('vite/module-runner').ModuleRunnerTransport} */
const transport = {
  async invoke(/** @type {import('vite').HotPayload} */ event) {
    const hotPayloadData = event['data']

    const id = hotPayloadData['data'][0]

    if (id === 'test_invalid_error') {
      return {
        error: 'a string instead of an error'
      }
    }

    if (id !== 'virtual:invoke-default-string') {
      return {
        error: new Error(`error, module not found: ${id}`)
      }
    }

    return {
      result: {
        "code": "__vite_ssr_exports__.default = 'hello invoke world'",
        "id": "\0virtual:invoke-default-string",
      }
    };
  },
}

const runner = new ModuleRunner(
  {
    root: fileURLToPath(new URL('./', import.meta.url)),
    transport,
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

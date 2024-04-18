// @ts-check

import { parentPort } from 'node:worker_threads'
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
      },
      methods: {
        import(id) {
          return runner.import(id)
        },
        ping() {
          return runner.transport.invoke('pong', 'ping')
        }
      }
    })
  },
  new ESModulesEvaluator(),
)

parentPort.postMessage('ready')
// the consumer-controlled "runtime" that a full reload recreates: a worker
// thread running a NativeModuleRunner over a parentPort message transport
import { parentPort } from 'node:worker_threads'
import { NativeModuleRunner } from 'vite/module-runner'

const runner = new NativeModuleRunner({
  transport: {
    connect({ onMessage }) {
      parentPort.on('message', (payload) => {
        // test driver messages are not transport payloads
        if (payload && payload.__test) return
        onMessage(payload)
      })
    },
    send(payload) {
      parentPort.postMessage(payload)
    },
  },
})

parentPort.on('message', async (message) => {
  if (!message || message.__test !== 'import') return
  try {
    const mod = await runner.import(message.url)
    parentPort.postMessage({
      __test: 'import-result',
      id: message.id,
      value: await mod.render(),
    })
  } catch (error) {
    parentPort.postMessage({
      __test: 'import-result',
      id: message.id,
      error: String(error && error.message),
    })
  }
})

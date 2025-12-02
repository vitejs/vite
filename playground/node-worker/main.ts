import type { Worker } from 'node:worker_threads'
import createChunkWorker from './worker?nodeWorker'
import createInlineWorker from './worker-inline?nodeWorker&inline'

function executeWorker(factory: () => Worker, message: string) {
  return new Promise<string>((resolve, reject) => {
    const worker = factory()

    const cleanup = async () => {
      try {
        await worker.terminate()
      } catch {
        // ignore termination errors during cleanup
      }
    }

    worker.once('message', async (data) => {
      await cleanup()
      resolve(String(data))
    })

    worker.once('error', async (error) => {
      await cleanup()
      reject(error)
    })

    worker.postMessage(message)
  })
}

export function run(message: string) {
  return executeWorker(createChunkWorker, message)
}

export function runInline(message: string) {
  return executeWorker(createInlineWorker, message)
}

export async function runBoth(message: string) {
  const [chunkResult, inlineResult] = await Promise.all([
    run(message),
    runInline(message),
  ])

  return { chunkResult, inlineResult }
}

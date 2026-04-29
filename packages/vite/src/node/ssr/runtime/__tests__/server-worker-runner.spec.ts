import { BroadcastChannel, Worker } from 'node:worker_threads'
import { describe, expect, it, onTestFinished } from 'vitest'
import type { HotChannel, HotChannelListener, HotPayload } from 'vite'
import { DevEnvironment } from '../../..'
import { createServer } from '../../../server'

const createWorkerTransport = (worker: Worker): HotChannel => {
  const handlerToWorkerListener = new WeakMap<
    HotChannelListener,
    (value: HotPayload) => void
  >()
  const client = {
    send(payload: HotPayload) {
      worker.postMessage(payload)
    },
  }

  return {
    send: (data) => worker.postMessage(data),
    on: (event: string, handler: HotChannelListener) => {
      // client is already connected
      if (event === 'vite:client:connect') return
      if (event === 'vite:client:disconnect') {
        const listener = () => {
          handler(undefined, client)
        }
        handlerToWorkerListener.set(handler, listener)
        worker.on('exit', listener)
        return
      }

      const listener = (value: HotPayload) => {
        if (value.type === 'custom' && value.event === event) {
          handler(value.data, client)
        }
      }
      handlerToWorkerListener.set(handler, listener)
      worker.on('message', listener)
    },
    off: (event, handler: HotChannelListener) => {
      if (event === 'vite:client:connect') return
      if (event === 'vite:client:disconnect') {
        const listener = handlerToWorkerListener.get(handler)
        if (listener) {
          worker.off('exit', listener)
          handlerToWorkerListener.delete(handler)
        }
        return
      }

      const listener = handlerToWorkerListener.get(handler)
      if (listener) {
        worker.off('message', listener)
        handlerToWorkerListener.delete(handler)
      }
    },
  }
}

describe('running module runner inside a worker', () => {
  it('correctly runs ssr code', async () => {
    expect.assertions(1)
    const worker = new Worker(
      new URL('./fixtures/worker.mjs', import.meta.url),
      {
        stdout: true,
      },
    )
    await new Promise<void>((resolve, reject) => {
      worker.on('message', () => resolve())
      worker.on('error', reject)
    })
    const server = await createServer({
      root: import.meta.dirname,
      logLevel: 'error',
      server: {
        middlewareMode: true,
        watch: null,
        hmr: {
          port: 9609,
        },
      },
      environments: {
        worker: {
          dev: {
            createEnvironment: (name, config) => {
              return new DevEnvironment(name, config, {
                hot: false,
                transport: createWorkerTransport(worker),
              })
            },
          },
        },
      },
    })
    onTestFinished(async () => {
      await Promise.allSettled([server.close(), worker.terminate()])
    })
    const channel = new BroadcastChannel('vite-worker')
    return new Promise<void>((resolve, reject) => {
      channel.onmessage = (event) => {
        try {
          expect(event.data).toEqual({
            result: 'hello world',
          })
        } catch (e) {
          reject(e)
        } finally {
          resolve()
        }
      }
      channel.postMessage({ id: './fixtures/default-string.ts' })
    })
  })
})

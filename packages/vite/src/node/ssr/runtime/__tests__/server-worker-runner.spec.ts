import { BroadcastChannel, Worker } from 'node:worker_threads'
import { describe, expect, it, onTestFinished } from 'vitest'
import type { HotChannel, HotChannelListener, HotPayload } from 'vite'
import { DevEnvironment } from '../../..'
import { createServer } from '../../../server'

const createWorkerTransport = (w: Worker): HotChannel => {
  const handlerToWorkerListener = new WeakMap<
    HotChannelListener,
    (value: HotPayload) => void
  >()

  return {
    send: (data) => w.postMessage(data),
    on: (event: string, handler: HotChannelListener) => {
      if (event === 'connection') return

      const listener = (value: HotPayload) => {
        if (value.type === 'custom' && value.event === event) {
          const client = {
            send(payload: HotPayload) {
              w.postMessage(payload)
            },
          }
          handler(value.data, client)
        }
      }
      handlerToWorkerListener.set(handler, listener)
      w.on('message', listener)
    },
    off: (event, handler: HotChannelListener) => {
      if (event === 'connection') return
      const listener = handlerToWorkerListener.get(handler)
      if (listener) {
        w.off('message', listener)
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
      root: __dirname,
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
    onTestFinished(() => {
      server.close()
      worker.terminate()
    })
    const channel = new BroadcastChannel('vite-worker')
    return new Promise<void>((resolve, reject) => {
      channel.onmessage = (event) => {
        try {
          expect((event as MessageEvent).data).toEqual({
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

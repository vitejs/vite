import { BroadcastChannel, Worker } from 'node:worker_threads'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { HotChannel, HotChannelListener, HotPayload } from 'vite'
import { DevEnvironment } from '../../..'
import { type ViteDevServer, createServer } from '../../../server'

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

describe('running module runner inside a worker and using the ModuleRunnerTransport#invoke API', () => {
  let worker: Worker
  let server: ViteDevServer

  beforeAll(async () => {
    worker = new Worker(
      new URL('./fixtures/worker.invoke.mjs', import.meta.url),
      {
        stdout: true,
      },
    )
    await new Promise<void>((resolve, reject) => {
      worker.on('message', () => resolve())
      worker.on('error', reject)
    })
    server = await createServer({
      root: __dirname,
      logLevel: 'error',
      server: {
        middlewareMode: true,
        watch: null,
        hmr: {
          port: 9610,
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
  })

  afterAll(() => {
    server.close()
    worker.terminate()
  })

  it('correctly runs ssr code', async () => {
    const channel = new BroadcastChannel('vite-worker:invoke')
    return new Promise<void>((resolve, reject) => {
      channel.onmessage = (event) => {
        try {
          expect((event as MessageEvent).data).toEqual({
            result: 'hello invoke world',
          })
        } catch (e) {
          reject(e)
        } finally {
          resolve()
        }
      }
      channel.postMessage({ id: 'virtual:invoke-default-string' })
    })
  })

  it('triggers an error', async () => {
    const channel = new BroadcastChannel('vite-worker:invoke')
    return new Promise<void>((resolve, reject) => {
      channel.onmessage = (event) => {
        try {
          expect((event as MessageEvent).data.error).toContain(
            'Error: error, module not found: test_error',
          )
        } catch (e) {
          reject(e)
        } finally {
          resolve()
        }
      }
      channel.postMessage({ id: 'test_error' })
    })
  })

  it('triggers an unknown error', async () => {
    const channel = new BroadcastChannel('vite-worker:invoke')
    return new Promise<void>((resolve, reject) => {
      channel.onmessage = (event) => {
        try {
          expect((event as MessageEvent).data.error).toContain(
            'Error: Unknown invoke error',
          )
        } catch (e) {
          reject(e)
        } finally {
          resolve()
        }
      }
      channel.postMessage({ id: 'test_invalid_error' })
    })
  })
})

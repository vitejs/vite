import { BroadcastChannel, Worker } from 'node:worker_threads'
import { describe, expect, it, onTestFinished } from 'vitest'
import type { HotChannel, HotPayload } from 'vite'
import { DevEnvironment } from '../../..'
import { createServer } from '../../../server'

const createWorkerTransport = (
  w: Worker,
): Pick<HotChannel, 'send' | 'on'> & Partial<HotChannel> => {
  const handlerToWorkerListener = new WeakMap<
    (data: any) => void,
    (value: any) => void
  >()

  return {
    send: (data: HotPayload) => w.postMessage(data),
    on: (event, handler) => {
      if (event === 'connection') {
        return
      }

      const listener = (value: any) => {
        if (value.event === event) {
          const client = {
            send(...args: any[]) {
              let payload: HotPayload
              if (typeof args[0] === 'string') {
                payload = {
                  type: 'custom',
                  event: args[0],
                  data: args[1],
                }
              } else {
                payload = args[0]
              }
              w.postMessage(payload)
            },
            respond(
              event: string,
              invoke: 'response' | `response:${string}` | undefined,
              payload?: any,
            ) {
              w.postMessage({
                type: 'custom',
                event,
                invoke,
                data: payload,
              })
            },
          }
          handler(value.data, client, value.invoke)
        }
      }
      handlerToWorkerListener.set(handler, listener)
      w.on('message', listener)
    },
    off: (event, handler) => {
      if (event === 'connection') {
        return
      }
      const listener = handlerToWorkerListener.get(
        handler as (data: any) => void,
      )
      if (listener) {
        w.off('message', listener)
        handlerToWorkerListener.delete(handler as (data: any) => void)
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
                transport: createWorkerTransport(worker),
                hot: false,
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

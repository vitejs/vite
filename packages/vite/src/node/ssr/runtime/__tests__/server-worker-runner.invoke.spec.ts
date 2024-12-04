import { BroadcastChannel, Worker } from 'node:worker_threads'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { HotChannel, HotChannelListener, HotPayload } from 'vite'
import type { BirpcReturn } from 'birpc'
import { createBirpc } from 'birpc'
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
  let rpc: BirpcReturn<
    unknown,
    { invoke: (data: any) => Promise<{ result: any } | { error: any }> }
  >
  let handleInvoke: (data: any) => Promise<{ result: any } | { error: any }>

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
    handleInvoke = (data: any) => server.environments.ssr.hot.handleInvoke(data)
    rpc = createBirpc(
      {
        invoke: (data: any) => handleInvoke(data),
      },
      {
        post: (data) => worker.postMessage(data),
        on: (data) => worker.on('message', data),
      },
    )
  })

  afterAll(() => {
    server.close()
    worker.terminate()
    rpc.$close()
  })

  async function run(id: string) {
    const channel = new BroadcastChannel('vite-worker:invoke')
    return new Promise<any>((resolve, reject) => {
      channel.onmessage = (event) => {
        try {
          resolve((event as MessageEvent).data)
        } catch (e) {
          reject(e)
        }
      }
      channel.postMessage({ id })
    })
  }

  it('correctly runs ssr code', async () => {
    const output = await run('./fixtures/default-string.ts')
    expect(output).toStrictEqual({
      result: 'hello world',
    })
  })

  it('triggers an error', async () => {
    handleInvoke = async () => ({ error: new Error('This is an Invoke Error') })
    const output = await run('dummy')
    expect(output).not.toHaveProperty('result')
    expect(output.error).toContain('Error: This is an Invoke Error')
  })

  it('triggers an unknown error', async () => {
    handleInvoke = async () => ({ error: 'a string instead of an error' })
    const output = await run('dummy')
    expect(output).not.toHaveProperty('result')
    expect(output.error).toContain('Error: Unknown invoke error')
  })
})

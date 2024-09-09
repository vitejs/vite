import { BroadcastChannel, Worker } from 'node:worker_threads'
import { describe, expect, it, onTestFinished } from 'vitest'
import { DevEnvironment } from '../../../server/environment'
import { createServer } from '../../../server'
import { RemoteEnvironmentTransport } from '../../..'

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
                runner: {
                  transport: new RemoteEnvironmentTransport({
                    send: (data) => worker.postMessage(data),
                    onMessage: (handler) => worker.on('message', handler),
                  }),
                },
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

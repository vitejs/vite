import { Worker } from 'node:worker_threads'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { createServer } from '../../../server'
import { DevEnvironment } from '../../../server/environment'
import { RemoteEnvironmentTransport } from '../../..'

describe('running module runner inside a worker', () => {
  it('correctly runs ssr code', async () => {
    expect.assertions(6)
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

    const pong = vi.fn(() => 'pong')
    const transform = vi.fn(() => `export const test = true`)
    const transport = new RemoteEnvironmentTransport<
      {
        pong: (data: string) => void
      },
      {
        import: (url: string) => { default: string }
        ping: () => string
      }
    >({
      send: (data) => worker.postMessage(data),
      onMessage: (handler) => worker.on('message', handler),
      methods: {
        pong,
      },
    })

    const server = await createWorkerServer(transport, transform)
    onTestFinished(() => {
      worker.terminate()
    })

    // cross communication works
    const testModule = await transport.invoke(
      'import',
      './fixtures/default-string.ts',
    )
    expect(testModule.default).toBe('hello world')

    expect(pong).not.toHaveBeenCalled()

    const pinPong = await transport.invoke('ping')
    expect(pinPong).toBe('pong')
    expect(pong).toHaveBeenCalled()

    expect(transform).not.toHaveBeenCalled()

    await server.environments.worker.evaluate('virtual:worker-test')

    expect(transform).toHaveBeenCalled()
  })
})

async function createWorkerServer(
  transport: RemoteEnvironmentTransport,
  transform: () => string,
) {
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
    plugins: [
      {
        name: 'test:worker',
        resolveId(id) {
          if (id === 'virtual:worker-test') {
            return `\0virtual:worker-test`
          }
        },
        load(id) {
          if (id === '\0virtual:worker-test') {
            return transform()
          }
        },
      },
    ],
    environments: {
      worker: {
        dev: {
          createEnvironment: (server) => {
            return new DevEnvironment(server, 'worker', {
              runner: {
                transport,
              },
            })
          },
        },
      },
    },
  })
  onTestFinished(() => {
    server.close()
  })
  return server
}

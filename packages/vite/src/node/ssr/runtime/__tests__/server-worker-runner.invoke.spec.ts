import path from 'node:path'
import { BroadcastChannel, Worker } from 'node:worker_threads'
import { createBirpc } from 'birpc'
import { describe, expect, it as baseIt, vi } from 'vitest'
import { DevEnvironment } from '../../..'
import { createServer } from '../../../server'

const it = baseIt
  // eslint-disable-next-line no-empty-pattern
  .extend('worker', async ({}, { onCleanup }) => {
    const worker = new Worker(
      new URL('./fixtures/worker.invoke.mjs', import.meta.url),
      {
        stdout: true,
      },
    )
    onCleanup(async () => {
      await worker.terminate()
    })
    await new Promise<void>((resolve, reject) => {
      worker.on('message', () => resolve())
      worker.on('error', reject)
    })
    return worker
  })
  // eslint-disable-next-line no-empty-pattern
  .extend('server', async ({}, { onCleanup }) => {
    const server = await createServer({
      root: import.meta.dirname,
      logLevel: 'error',
      server: {
        middlewareMode: true,
        watch: null,
        hmr: {
          port: 9610,
        },
        fs: {
          allow: [path.resolve(import.meta.dirname, './fixtures')],
        },
      },
      environments: {
        worker: {
          dev: {
            createEnvironment: (name, config) => {
              return new DevEnvironment(name, config, {
                hot: false,
              })
            },
          },
        },
      },
    })
    onCleanup(() => server.close())
    return server
  })
  .extend('handleInvoke', ({ server }) =>
    vi.fn((data: any) => server.environments.worker.hot.handleInvoke(data)),
  )
  .extend('run', ({ worker, handleInvoke }, { onCleanup }) => {
    const rpc = createBirpc(
      {
        invoke: (data: any) => handleInvoke(data),
      },
      {
        post: (data) => worker.postMessage(data),
        on: (data) => worker.on('message', data),
      },
    )
    const channel = new BroadcastChannel('vite-worker:invoke')
    onCleanup(() => {
      channel.close()
      rpc.$close()
    })
    return async (id: string) => {
      return new Promise<any>((resolve, reject) => {
        channel.onmessage = (event) => {
          try {
            resolve(event.data)
          } catch (e) {
            reject(e)
          }
        }
        channel.postMessage({ id })
      })
    }
  })

describe('running module runner inside a worker and using the ModuleRunnerTransport#invoke API', () => {
  it('correctly runs ssr code', async ({ run }) => {
    const output = await run('./fixtures/default-string.ts')
    expect(output).toStrictEqual({
      result: 'hello world',
    })
  })

  it('triggers an error', async ({ run, handleInvoke }) => {
    handleInvoke.mockResolvedValue({
      error: new Error('This is an Invoke Error'),
    })
    const output = await run('dummy')
    expect(output).not.toHaveProperty('result')
    expect(output.error).toContain('Error: This is an Invoke Error')
  })

  it('triggers an unknown error', async ({ run, handleInvoke }) => {
    handleInvoke.mockResolvedValue({ error: 'a string instead of an error' })
    const output = await run('dummy')
    expect(output).not.toHaveProperty('result')
    expect(output.error).toContain('Error: Unknown invoke error')
  })

  it('resolves builtin module without server round-trip', async ({ run }) => {
    const output = await run('./fixtures/builtin-import.ts')
    expect(output).toHaveProperty('result')
    expect(output.result).toBe('baz.txt')
    expect(output.error).toBeUndefined()
  })

  it('server.fs check is applied to the custom transport by default', async ({
    run,
  }) => {
    const output = await run('./fixture-outside.js')
    expect(output).toHaveProperty('error')
    expect(output.error).toContain('Failed to load url')
  })
})

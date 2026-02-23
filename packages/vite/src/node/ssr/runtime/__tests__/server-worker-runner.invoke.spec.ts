import { BroadcastChannel, Worker } from 'node:worker_threads'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { BirpcReturn } from 'birpc'
import { createBirpc } from 'birpc'
import { DevEnvironment } from '../../..'
import { type ViteDevServer, createServer } from '../../../server'

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
      root: import.meta.dirname,
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

  afterAll(async () => {
    await Promise.allSettled([server.close(), worker.terminate()])
    rpc.$close()
  })

  async function run(id: string) {
    const channel = new BroadcastChannel('vite-worker:invoke')
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

  it('resolves builtin module without server round-trip', async () => {
    handleInvoke = (data: any) => server.environments.ssr.hot.handleInvoke(data)

    const output = await run('./fixtures/builtin-import.ts')
    expect(output).toHaveProperty('result')
    expect(output.result).toBe('baz.txt')
    expect(output.error).toBeUndefined()
  })
})

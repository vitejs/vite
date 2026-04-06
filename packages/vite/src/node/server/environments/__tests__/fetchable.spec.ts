import { afterEach, describe, expect, it } from 'vitest'
import type { ViteDevServer } from '../../index'
import { createServer } from '../../index'
import { isFetchableDevEnvironment } from '../fetchableEnvironments'
import {
  createRunnableDevEnvironment,
  isRunnableDevEnvironment,
} from '../runnableEnvironment'

let server: ViteDevServer

afterEach(async () => {
  await server?.close()
})

const fixtureUrl = '/fixtures/fetch-handler.js'

describe('RunnableDevEnvironment satisfies fetchable interface', () => {
  it('isFetchableDevEnvironment returns true for ssr environment', async () => {
    server = await createServer({
      root: import.meta.dirname,
      logLevel: 'error',
      server: { middlewareMode: true, watch: null, ws: false },
      optimizeDeps: { disabled: true, noDiscovery: true, include: [] },
    })
    const env = server.environments.ssr
    expect(isFetchableDevEnvironment(env)).toBe(true)
    expect(isRunnableDevEnvironment(env)).toBe(true)
  })

  it('dispatchFetch uses runner to import request.url and call default export', async () => {
    server = await createServer({
      root: import.meta.dirname,
      logLevel: 'error',
      server: { middlewareMode: true, watch: null, ws: false },
      optimizeDeps: { disabled: true, noDiscovery: true, include: [] },
    })
    const env = server.environments.ssr
    if (!isFetchableDevEnvironment(env)) {
      throw new Error('expected FetchableDevEnvironment')
    }

    const response = await env.dispatchFetch(
      new Request(`http://localhost${fixtureUrl}`),
    )
    expect(response).toBeInstanceOf(Response)
    const text = await response.text()
    expect(text).toBe(`hello from http://localhost${fixtureUrl}`)
  })

  it('dispatchFetch uses custom requestHandlerExport', async () => {
    server = await createServer({
      root: import.meta.dirname,
      logLevel: 'error',
      server: { middlewareMode: true, watch: null, ws: false },
      optimizeDeps: { disabled: true, noDiscovery: true, include: [] },
      environments: {
        ssr: {
          dev: {
            createEnvironment(name, config) {
              return createRunnableDevEnvironment(name, config, {
                requestHandlerExport: 'custom',
              })
            },
          },
        },
      },
    })
    const env = server.environments.ssr
    if (!isFetchableDevEnvironment(env)) {
      throw new Error('expected FetchableDevEnvironment')
    }

    const response = await env.dispatchFetch(
      new Request(`http://localhost${fixtureUrl}`),
    )
    const text = await response.text()
    expect(text).toBe(`custom handler: http://localhost${fixtureUrl}`)
  })
})

import http from 'node:http'
import type { AddressInfo } from 'node:net'
import connect from 'connect'
import { afterEach, describe, expect, test, vi } from 'vitest'
import type { ViteDevServer } from '../..'
import { BundledDev } from '../../bundledDev'
import {
  PayloadMapStore,
  bundledDevPatchMiddleware,
  bundledDevPayloadMapMiddleware,
} from '../bundledDevPayload'
import { triggerLazyBundlingMiddleware } from '../triggerLazyBundling'

const query = 's=7&g=2&u=bAQ&e=bBg&f=bDg&n=3'

describe('PayloadMapStore', () => {
  test('drops the least recently used maps past its count', () => {
    const store = new PayloadMapStore('p', 2, Infinity)
    const a = store.add('a')
    const b = store.add('b')
    expect(store.get(a)).toBe('a')
    const c = store.add('c')
    expect(store.size).toBe(2)
    expect(store.get(b)).toBeUndefined()
    expect(store.get(a)).toBe('a')
    expect(store.get(c)).toBe('c')
  })

  test('drops old maps past its total length, but keeps the newest', () => {
    const store = new PayloadMapStore('p', Infinity, 4)
    const a = store.add('aa')
    const b = store.add('bb')
    const c = store.add('cc')
    expect(store.get(a)).toBeUndefined()
    expect([store.get(b), store.get(c)]).toStrictEqual(['bb', 'cc'])
    const large = store.add('x'.repeat(10))
    expect(store.size).toBe(1)
    expect(store.get(large)).toBe('x'.repeat(10))
  })

  test('gives a map that is already stored its id again', () => {
    const store = new PayloadMapStore('l', 2, Infinity)
    const a = store.add('a')
    expect(a).toBe('l0')
    const b = store.add('b')
    // the same map from another tab, so `a` is now used last
    expect(store.add('a')).toBe(a)
    expect(store.size).toBe(2)
    store.add('c')
    expect(store.get(b)).toBeUndefined()
    expect(store.get(a)).toBe('a')
    // a dropped map gets a new id
    expect(store.add('b')).toBe('l3')
  })
})

describe('bundled dev payload routes', () => {
  let httpServer: http.Server | undefined

  afterEach(async () => {
    httpServer?.closeAllConnections()
    await new Promise((resolve) => httpServer?.close(resolve))
    httpServer = undefined
  })

  async function setup() {
    const bundledDev = new BundledDev({} as any)
    const devEngine = {
      renderPatch: vi.fn(async (q: string) =>
        q.includes('s=0')
          ? { type: 'Reload', reason: 'another epoch' }
          : {
              type: 'Patch',
              code: `patch(${JSON.stringify(q)})`,
              sourcemap: q.includes('map=1') ? '{"version":3}' : undefined,
            },
      ),
      compileEntry: vi.fn(async (id: string, q: string) =>
        q.includes('s=0')
          ? { type: 'Reload', reason: 'another epoch' }
          : {
              type: 'Chunk',
              code: `lazy(${JSON.stringify(id)}, ${JSON.stringify(q)})`,
              sourcemap: q.includes('map=1') ? '{"version":3}' : undefined,
            },
      ),
    }
    ;(bundledDev as any)._devEngine = devEngine
    const server = {
      environments: { client: { bundledDev } },
      config: {
        base: '/',
        server: { headers: {} },
        logger: { error: vi.fn() },
      },
    } as unknown as ViteDevServer
    const app = connect()
    app.use(triggerLazyBundlingMiddleware(server))
    app.use(bundledDevPatchMiddleware(server))
    app.use(bundledDevPayloadMapMiddleware(server))
    app.use((_req, res) => {
      res.statusCode = 404
      res.end('next')
    })
    httpServer = http.createServer(app)
    await new Promise<void>((resolve) =>
      httpServer!.listen(0, '127.0.0.1', resolve),
    )
    const { port } = httpServer.address() as AddressInfo
    const url = (path: string) => `http://127.0.0.1:${port}${path}`
    return { bundledDev, devEngine, url }
  }

  test('the patch route renders the query and keeps the payload ESM', async () => {
    const { devEngine, url } = await setup()
    const res = await fetch(url(`/__rolldown_hmr_patch.js?${query}`))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/javascript')
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.text()).toBe(
      `patch(${JSON.stringify(query)})\n; export {}`,
    )
    expect(devEngine.renderPatch).toHaveBeenCalledWith(query)
  })

  test('the lazy route compiles the module with the query and keeps the payload ESM', async () => {
    const { devEngine, url } = await setup()
    const lazyQuery = `id=%2Fsrc%2Fa.js&${query}`
    const res = await fetch(url(`/@vite/lazy?${lazyQuery}`))
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(
      `lazy(${JSON.stringify('/src/a.js')}, ${JSON.stringify(lazyQuery)})\n; export {}`,
    )
    expect(devEngine.compileEntry).toHaveBeenCalledWith('/src/a.js', lazyQuery)
  })

  test('a client the engine cannot serve gets a reload body', async () => {
    const { url } = await setup()
    const reloadBody =
      '__rolldown_runtime__.reloadNeeded("another epoch");\nexport {}'
    const patch = await fetch(url('/__rolldown_hmr_patch.js?s=0&g=0&n=1'))
    expect(patch.status).toBe(200)
    expect(await patch.text()).toBe(`${reloadBody}\n; export {}`)
    const lazy = await fetch(url('/@vite/lazy?id=%2Fsrc%2Fa.js&s=0&g=0&n=2'))
    expect(lazy.status).toBe(200)
    expect(await lazy.text()).toBe(`${reloadBody}\n; export {}`)
  })

  test('a payload links its sourcemap, and the map route serves it', async () => {
    const { url } = await setup()
    const res = await fetch(url(`/__rolldown_hmr_patch.js?${query}&map=1`))
    const code = await res.text()
    const mapUrl = /\/\/# sourceMappingURL=(\S+)$/.exec(code)?.[1]
    expect(mapUrl).toBe('/__rolldown_payload_map_p0.map')
    expect(code).not.toContain('base64')

    const map = await fetch(url(mapUrl!))
    expect(map.status).toBe(200)
    expect(map.headers.get('content-type')).toBe('application/json')
    expect(await map.text()).toBe('{"version":3}')
    expect((await fetch(url('/__rolldown_payload_map_p9.map'))).status).toBe(
      404,
    )
    expect((await fetch(url('/__rolldown_payload_map_l0.map'))).status).toBe(
      404,
    )

    // another tab that gets the same patch gets the same map
    const again = await (
      await fetch(url(`/__rolldown_hmr_patch.js?${query}&map=1`))
    ).text()
    expect(again.endsWith('/__rolldown_payload_map_p0.map')).toBe(true)

    // a lazy chunk keeps its map apart from the patches
    const lazy = await (
      await fetch(url(`/@vite/lazy?id=%2Fsrc%2Fa.js&${query}&map=1`))
    ).text()
    expect(lazy.endsWith('/__rolldown_payload_map_l0.map')).toBe(true)
    expect((await fetch(url('/__rolldown_payload_map_l0.map'))).status).toBe(
      200,
    )
  })

  test('a query with no generation gets the generation of the output', async () => {
    const { bundledDev, devEngine, url } = await setup()
    await fetch(url('/__rolldown_hmr_patch.js?s=7&u=bAQ&n=1'))
    // no output yet: the query goes to the engine as is
    expect(devEngine.renderPatch).toHaveBeenLastCalledWith('s=7&u=bAQ&n=1')

    bundledDev.outputGeneration = 4
    await fetch(url('/__rolldown_hmr_patch.js?s=7&u=bAQ&n=2'))
    expect(devEngine.renderPatch).toHaveBeenLastCalledWith('s=7&u=bAQ&n=2&g=4')
    await fetch(url('/@vite/lazy?id=%2Fsrc%2Fa.js&s=7&n=3'))
    expect(devEngine.compileEntry).toHaveBeenLastCalledWith(
      '/src/a.js',
      'id=%2Fsrc%2Fa.js&s=7&n=3&g=4',
    )
    // a known generation stays
    await fetch(url(`/__rolldown_hmr_patch.js?${query}`))
    expect(devEngine.renderPatch).toHaveBeenLastCalledWith(query)
  })
})

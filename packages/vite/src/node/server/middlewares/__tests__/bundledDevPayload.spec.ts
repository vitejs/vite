import http from 'node:http'
import type { AddressInfo } from 'node:net'
import connect from 'connect'
import { afterEach, describe, expect, test, vi } from 'vitest'
import type { Connect } from '#dep-types/connect'
import type { ViteDevServer } from '../..'
import { BUNDLED_DEV_HMR_HAVE_CONTENT_TYPE } from '../../../../shared/constants'
import { BundledDev } from '../../bundledDev'
import {
  HaveQueryStore,
  PayloadMapStore,
  bundledDevHaveMiddleware,
  bundledDevPatchMiddleware,
  bundledDevPayloadMapMiddleware,
} from '../bundledDevPayload'
import { triggerLazyBundlingMiddleware } from '../triggerLazyBundling'

const query = 's=7&g=2&u=bAQ&e=dBeMHqEY&f=bDg&n=3'
const tokenReloadBody =
  '__rolldown_runtime__.reloadNeeded("the have-set token is unknown or expired");\nexport {}'

describe('HaveQueryStore', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('a token stands for its query once', () => {
    const store = new HaveQueryStore()
    const token = store.add(query)!
    expect(token).toMatch(/^[\w-]{24}$/)
    expect(store.add(query)).not.toBe(token)
    expect(store.take(token)).toBe(query)
    expect(store.take(token)).toBeUndefined()
    expect(store.take('unknown')).toBeUndefined()
  })

  test('a token expires after the TTL', () => {
    vi.useFakeTimers()
    const store = new HaveQueryStore(64, Infinity, 60_000)
    const kept = store.add('kept')!
    const expired = store.add('expired')!
    vi.advanceTimersByTime(59_999)
    expect(store.take(kept)).toBe('kept')
    vi.advanceTimersByTime(1)
    expect(store.take(expired)).toBeUndefined()
  })

  test('a full store keeps its live tokens and refuses new ones', () => {
    vi.useFakeTimers()
    const store = new HaveQueryStore(3, Infinity, 1000)
    store.add('a')
    vi.advanceTimersByTime(1000)
    const b = store.add('b')!
    // `a` expired and is gone
    expect(store.size).toBe(1)
    const c = store.add('c')!
    const d = store.add('d')!
    expect(store.add('e')).toBeUndefined()
    expect([store.take(b), store.take(c), store.take(d)]).toStrictEqual([
      'b',
      'c',
      'd',
    ])
    expect(store.add('e')).toMatch(/^[\w-]{24}$/)
  })

  test('a store refuses a query over its total length', () => {
    const store = new HaveQueryStore(64, 5)
    const abc = store.add('abc')!
    expect(store.add('def')).toBeUndefined()
    expect(store.take(abc)).toBe('abc')
    expect(store.add('defgh')).toMatch(/^[\w-]{24}$/)
  })

  test('resolve maps a token query to the stored query', () => {
    const store = new HaveQueryStore()
    expect(store.resolve(query)).toBe(query)
    const token = store.add(query)
    expect(store.resolve(`t=${token}&n=3`)).toBe(query)
    expect(store.resolve(`t=${token}&n=3`)).toBeUndefined()
    expect(store.resolve(`id=%2Fa.js&t=${store.add(query)}&n=4`)).toBe(query)
  })
})

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

  async function setup(parent?: Connect.NextHandleFunction) {
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
    if (parent) app.use(parent)
    app.use(bundledDevHaveMiddleware(server))
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
    const post = (body: string, type = BUNDLED_DEV_HMR_HAVE_CONTENT_TYPE) =>
      fetch(url('/__rolldown_hmr_have'), {
        method: 'POST',
        headers: { 'content-type': type },
        body,
      })
    return { bundledDev, devEngine, url, post }
  }

  test('the POST route stores the body and answers a token', async () => {
    const { bundledDev, url, post } = await setup()
    const res = await post(query)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/plain')
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
    const token = await res.text()
    expect(bundledDev.haveQueries.take(token)).toBe(query)

    // only POST is handled
    expect((await fetch(url('/__rolldown_hmr_have'))).status).toBe(404)
  })

  test('the POST route rejects a type that needs no CORS preflight', async () => {
    const { bundledDev, post } = await setup()
    const res = await post(query, 'text/plain')
    expect(res.status).toBe(415)
    expect(bundledDev.haveQueries.size).toBe(0)
  })

  test('the POST route compares the media type only', async () => {
    const { bundledDev, post } = await setup()
    const res = await post(
      query,
      `${BUNDLED_DEV_HMR_HAVE_CONTENT_TYPE.toUpperCase()}; charset=utf-8`,
    )
    expect(res.status).toBe(200)
    expect(bundledDev.haveQueries.take(await res.text())).toBe(query)
  })

  test('the POST route answers 503 when the store is full', async () => {
    const { bundledDev, post } = await setup()
    bundledDev.haveQueries = new HaveQueryStore(1)
    expect((await post(query)).status).toBe(200)
    expect((await post(query)).status).toBe(503)
  })

  const parentBodyParser: Connect.NextHandleFunction = (req, _res, next) => {
    let body = ''
    req.setEncoding('utf8')
    req.on('data', (chunk: string) => (body += chunk))
    req.on('end', () => {
      ;(req as any).body = body
      next()
    })
  }

  /** A body of 1.5 MiB with no content-length. */
  function postChunked(url: (path: string) => string) {
    const chunk = new Uint8Array(512 * 1024).fill(101)
    let sent = 0
    return fetch(url('/__rolldown_hmr_have'), {
      method: 'POST',
      headers: { 'content-type': BUNDLED_DEV_HMR_HAVE_CONTENT_TYPE },
      body: new ReadableStream({
        pull(controller) {
          if (sent++ < 3) controller.enqueue(chunk)
          else controller.close()
        },
      }),
      duplex: 'half',
    } as RequestInit)
  }

  test('the POST route uses a body that the parent app read already', async () => {
    const { bundledDev, post } = await setup(parentBodyParser)
    const res = await post(query)
    expect(res.status).toBe(200)
    expect(bundledDev.haveQueries.take(await res.text())).toBe(query)
  })

  test('the POST route rejects a body over 1 MiB', async () => {
    const { bundledDev, url, post } = await setup()
    const res = await post('e'.repeat(1024 * 1024 + 1))
    expect(res.status).toBe(413)
    expect((await postChunked(url)).status).toBe(413)
    expect(bundledDev.haveQueries.size).toBe(0)
  })

  test('the POST route rejects a body over 1 MiB that the parent app read already', async () => {
    const { bundledDev, url } = await setup(parentBodyParser)
    expect((await postChunked(url)).status).toBe(413)
    expect(bundledDev.haveQueries.size).toBe(0)
  })

  test('the patch route resolves a token to the stored query once', async () => {
    const { devEngine, url, post } = await setup()
    const token = await (await post(query)).text()
    const tokenUrl = url(`/__rolldown_hmr_patch.js?t=${token}&n=3`)

    const res = await fetch(tokenUrl)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(
      `patch(${JSON.stringify(query)})\n; export {}`,
    )
    expect(devEngine.renderPatch).toHaveBeenCalledWith(query)

    const again = await fetch(tokenUrl)
    expect(again.status).toBe(200)
    expect(await again.text()).toBe(`${tokenReloadBody}\n; export {}`)
    expect(devEngine.renderPatch).toHaveBeenCalledTimes(1)
  })

  test('the lazy route resolves a token to the stored query once', async () => {
    const { devEngine, url, post } = await setup()
    const token = await (await post(query)).text()
    const tokenUrl = url(`/@vite/lazy?id=%2Fsrc%2Fa.js&t=${token}&n=3`)

    const res = await fetch(tokenUrl)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(
      `lazy(${JSON.stringify('/src/a.js')}, ${JSON.stringify(query)})\n; export {}`,
    )
    expect(devEngine.compileEntry).toHaveBeenCalledWith('/src/a.js', query)

    const again = await fetch(tokenUrl)
    expect(again.status).toBe(200)
    expect(await again.text()).toBe(`${tokenReloadBody}\n; export {}`)
    expect(devEngine.compileEntry).toHaveBeenCalledTimes(1)
  })

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

  test('a token query with no generation gets the generation of the output', async () => {
    const { bundledDev, devEngine, url, post } = await setup()
    bundledDev.outputGeneration = 4
    const patchToken = await (await post('s=7&u=bAQ&n=2')).text()
    await fetch(url(`/__rolldown_hmr_patch.js?t=${patchToken}&n=2`))
    expect(devEngine.renderPatch).toHaveBeenLastCalledWith('s=7&u=bAQ&n=2&g=4')
    const lazyToken = await (await post('s=7&n=3')).text()
    await fetch(url(`/@vite/lazy?id=%2Fsrc%2Fa.js&t=${lazyToken}&n=3`))
    expect(devEngine.compileEntry).toHaveBeenLastCalledWith(
      '/src/a.js',
      's=7&n=3&g=4',
    )
  })
})

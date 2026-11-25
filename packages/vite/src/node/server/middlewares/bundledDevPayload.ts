import { randomBytes } from 'node:crypto'
import type { ServerResponse } from 'node:http'
import type { Connect } from '#dep-types/connect'
import type { ViteDevServer } from '..'
import {
  BUNDLED_DEV_HMR_HAVE_CONTENT_TYPE,
  BUNDLED_DEV_HMR_HAVE_PATH,
  BUNDLED_DEV_HMR_PATCH_FILENAME,
  BUNDLED_DEV_PAYLOAD_MAP_PREFIX,
} from '../../../shared/constants'
import { cleanUrl } from '../../../shared/utils'
import type { BundledDevPayload } from '../bundledDev'

const patchUrlPrefix = `/${BUNDLED_DEV_HMR_PATCH_FILENAME}?`
const havePath = `/${BUNDLED_DEV_HMR_HAVE_PATH}`
const payloadMapUrlPattern = new RegExp(
  `^/${BUNDLED_DEV_PAYLOAD_MAP_PREFIX}([pl]\\d+)\\.map$`,
)

const maxHaveQueryBytes = 1024 * 1024

/**
 * Patch and lazy queries that were too long for a request URL. The runtime
 * POSTs such a query first, and the request URL carries the token instead
 * (`DevRuntime.requestQuery`). A token works once.
 *
 * A token is never dropped before it expires: the GET that uses it can wait
 * in the browser queue behind many other requests. When the store is full,
 * `add` returns `undefined` instead.
 */
export class HaveQueryStore {
  private queries = new Map<string, { query: string; expiresAt: number }>()
  private totalLength = 0

  constructor(
    private maxEntries: number = 1024,
    private maxTotalLength: number = 64 * 1024 * 1024,
    private ttlMs: number = 10 * 60_000,
  ) {}

  get size(): number {
    return this.queries.size
  }

  add(query: string): string | undefined {
    this.dropExpired()
    if (
      this.queries.size >= this.maxEntries ||
      this.totalLength + query.length > this.maxTotalLength
    ) {
      return undefined
    }
    const token = randomBytes(18).toString('base64url')
    this.queries.set(token, { query, expiresAt: Date.now() + this.ttlMs })
    this.totalLength += query.length
    return token
  }

  take(token: string): string | undefined {
    this.dropExpired()
    const entry = this.queries.get(token)
    if (!entry) return undefined
    this.queries.delete(token)
    this.totalLength -= entry.query.length
    return entry.query
  }

  /**
   * The query a patch or lazy request stands for: the stored query when it
   * carries a token `t`, else the query itself. `undefined` when the token is
   * unknown or expired.
   */
  resolve(query: string): string | undefined {
    const token = new URLSearchParams(query).get('t')
    return token == null ? query : this.take(token)
  }

  private dropExpired() {
    const now = Date.now()
    // all entries have the same TTL, so the insertion order is also the expiry order
    for (const [token, entry] of this.queries) {
      if (entry.expiresAt > now) break
      this.queries.delete(token)
      this.totalLength -= entry.query.length
    }
  }
}

/**
 * The sourcemaps of the patches or of the lazy chunks served lately. A payload
 * links its map instead of inlining it, so the browser downloads a map only
 * when devtools asks for it. The least recently used maps are dropped first
 * when the store is full. Patches and lazy chunks have one store each, so many
 * patches do not drop the maps of route code that still runs.
 *
 * Tabs in the same state get the same payload, so a map that is already stored
 * keeps its id, and N tabs cost one entry.
 */
export class PayloadMapStore {
  private maps = new Map<string, string>()
  private idsByMap = new Map<string, string>()
  private totalLength = 0
  private nextId = 0

  constructor(
    /** `p` for patches and `l` for lazy chunks: the id starts with it */
    private prefix: 'p' | 'l',
    private maxEntries: number = 256,
    private maxTotalLength: number = 64 * 1024 * 1024,
  ) {}

  get size(): number {
    return this.maps.size
  }

  /** Returns the id of the map. */
  add(map: string): string {
    const known = this.idsByMap.get(map)
    if (known !== undefined) {
      this.get(known)
      return known
    }
    const id = `${this.prefix}${this.nextId++}`
    this.maps.set(id, map)
    this.idsByMap.set(map, id)
    this.totalLength += map.length
    for (const [oldId, oldMap] of this.maps) {
      if (
        this.maps.size <= this.maxEntries &&
        this.totalLength <= this.maxTotalLength
      ) {
        break
      }
      if (oldId === id) break
      this.maps.delete(oldId)
      this.idsByMap.delete(oldMap)
      this.totalLength -= oldMap.length
    }
    return id
  }

  get(id: string): string | undefined {
    const map = this.maps.get(id)
    if (map !== undefined) {
      // used last, so dropped last
      this.maps.delete(id)
      this.maps.set(id, map)
    }
    return map
  }
}

export function bundledDevPayloadMapMiddleware(
  server: ViteDevServer,
): Connect.NextHandleFunction {
  const bundledDev = server.environments.client.bundledDev
  if (!bundledDev) {
    throw new Error(
      'bundledDevPayloadMapMiddleware can only be used for fullBundleMode',
    )
  }

  return function viteBundledDevPayloadMapMiddleware(req, res, next) {
    const id = req.url && payloadMapUrlPattern.exec(cleanUrl(req.url))?.[1]
    const maps = id?.[0] === 'l' ? bundledDev.lazyMaps : bundledDev.patchMaps
    const map = id ? maps.get(id) : undefined
    if (map === undefined) {
      return next()
    }
    const headers = server.config.server.headers
    for (const name in headers) {
      res.setHeader(name, headers[name]!)
    }
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.end(map)
  }
}

export function bundledDevHaveMiddleware(
  server: ViteDevServer,
): Connect.NextHandleFunction {
  const bundledDev = server.environments.client.bundledDev
  if (!bundledDev) {
    throw new Error(
      'bundledDevHaveMiddleware can only be used for fullBundleMode',
    )
  }

  const store = (query: string, res: ServerResponse) => {
    const token = bundledDev.haveQueries.add(query)
    if (token === undefined) {
      res.writeHead(503).end()
      return
    }
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Cache-Control', 'no-store')
    res.end(token)
  }

  return function viteBundledDevHaveMiddleware(req, res, next) {
    if (req.method !== 'POST' || !req.url || cleanUrl(req.url) !== havePath) {
      return next()
    }
    // A plain form or a no-cors fetch cannot send this type. So a page on
    // another origin needs a CORS preflight, which `server.cors` answers.
    const mediaType = req.headers['content-type']
      ?.split(';')[0]!
      .trim()
      .toLowerCase()
    if (mediaType !== BUNDLED_DEV_HMR_HAVE_CONTENT_TYPE) {
      res.writeHead(415).end()
      return
    }
    const tooLarge = () => {
      res.writeHead(413).end()
    }
    if (Number(req.headers['content-length']) > maxHaveQueryBytes) {
      return tooLarge()
    }
    // a body parser of the parent app read the body already, so no 'end' event comes
    if (req.readableEnded) {
      const body: unknown = (req as { body?: unknown }).body
      if (typeof body !== 'string' && !Buffer.isBuffer(body)) {
        res.writeHead(400).end()
        return
      }
      // a chunked body has no content-length, so the check above missed it
      if (Buffer.byteLength(body) > maxHaveQueryBytes) {
        return tooLarge()
      }
      return store(typeof body === 'string' ? body : body.toString('utf8'), res)
    }
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      if (size > maxHaveQueryBytes) return
      size += chunk.length
      if (size > maxHaveQueryBytes) {
        tooLarge()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (size > maxHaveQueryBytes) return
      store(Buffer.concat(chunks).toString('utf8'), res)
    })
    req.on('error', next)
  }
}

export function bundledDevPatchMiddleware(
  server: ViteDevServer,
): Connect.NextHandleFunction {
  const bundledDev = server.environments.client.bundledDev
  if (!bundledDev) {
    throw new Error(
      'bundledDevPatchMiddleware can only be used for fullBundleMode',
    )
  }

  return async function viteBundledDevPatchMiddleware(req, res, next) {
    if (!req.url?.startsWith(patchUrlPrefix)) {
      return next()
    }
    let payload: BundledDevPayload
    try {
      payload = await bundledDev.renderPatch(
        req.url.slice(patchUrlPrefix.length),
      )
    } catch (e) {
      server.config.logger.error(`Failed to render the HMR patch: ${e}`, {
        error: e,
      })
      return next(new Error(`Failed to render the HMR patch`))
    }
    sendPayload(server, res, payload, bundledDev.patchMaps)
  }
}

export function sendPayload(
  server: ViteDevServer,
  res: ServerResponse,
  payload: BundledDevPayload,
  maps: PayloadMapStore,
): void {
  const headers = server.config.server.headers
  for (const name in headers) {
    res.setHeader(name, headers[name]!)
  }
  // ensure that the payload contains ESM syntax
  // this is to avoid attacks like GHSA-4v9v-hfq4-rm2v
  // https://github.com/webpack/webpack-dev-server/security/advisories/GHSA-4v9v-hfq4-rm2v
  // https://green.sapphi.red/blog/local-server-security-best-practices#_2-using-xssi-and-modifying-the-prototype
  // https://green.sapphi.red/blog/local-server-security-best-practices#properly-check-the-request-origin
  // we can also use `Cross-Origin Resource Policy` header instead of this
  // but we cannot use `Sec-Fetch-*` headers as they are only sent to potentially-trustworthy origins
  let code = payload.code + '\n; export {}'
  if (payload.map) {
    const id = maps.add(payload.map)
    code += `\n//# sourceMappingURL=${server.config.base}${BUNDLED_DEV_PAYLOAD_MAP_PREFIX}${id}.map`
  }
  res.setHeader('Content-Type', 'text/javascript')
  res.setHeader('Cache-Control', 'no-store')
  res.end(code)
}

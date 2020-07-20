// These are injected by the server on the fly so that we invalidate the cache.
const __ENABLED__ = true
const __PROJECT_ROOT__ = '/'
const __SERVER_ID__ = 1
const __LOCKFILE_HASH__ = 'a'

// We use two separate caches:
// 1. The user files cache is based on the server start timestamp: i.e. it
//    persists only for the session of a server process. It is reset every time
//    the user restarts the server.
const USER_CACHE_NAME = `vite-cache-${__PROJECT_ROOT__}-${__SERVER_ID__}`
// 2. The deps cache is based on the project's lockfile. They are less likely
//    to change, so they are only invalidated when the lockfile has changed.
const DEPS_CACHE_NAME = `vite-cache-${__PROJECT_ROOT__}-${__LOCKFILE_HASH__}`

const sw = (self as any) as ServiceWorkerGlobalScope

sw.addEventListener('install', () => {
  // console.log('[vite:sw] install')
  sw.skipWaiting()
})

sw.addEventListener('activate', (e) => {
  // console.log('[vite:sw] activated')
  sw.clients.claim()
  // delete any non-matching caches
  e.waitUntil(
    (async () => {
      const keys = await caches.keys()
      for (const key of keys) {
        if (key !== USER_CACHE_NAME && key !== DEPS_CACHE_NAME) {
          await caches.delete(key)
        }
      }
    })()
  )
})

const extRe = /(\bindex)?\.\w+$/

sw.addEventListener('message', async (e) => {
  if (e.data.type === 'bust-cache') {
    // console.log(`[vite:sw] busted cache for ${e.data.path}`)
    const path = e.data.path
    const userCache = await caches.open(USER_CACHE_NAME)
    const depsCache = await caches.open(DEPS_CACHE_NAME)
    userCache.delete(path)
    depsCache.delete(path)

    // also bust cache for extension-less paths - this happens when the user
    // has non-statically-analyzable dynamic import paths.
    if (extRe.test(path)) {
      const cleanPath = path.replace(extRe, '')
      userCache.delete(cleanPath)
      depsCache.delete(cleanPath)
    }

    // notify the client that cache has been busted
    e.ports[0].postMessage({
      busted: true
    })
  }
})

const depsRE = /^\/@modules\//
const clientPath = `/vite/client`
const hmrRequestRE = /(&|\?)t=\d+/

sw.addEventListener('fetch', (e) => {
  if (!__ENABLED__) {
    return
  }

  const url = new URL(e.request.url)
  // no need to cache hmr update requests
  if (url.pathname !== clientPath && !url.search.match(hmrRequestRE)) {
    const cacheToUse = depsRE.test(url.pathname)
      ? DEPS_CACHE_NAME
      : USER_CACHE_NAME
    e.respondWith(tryCache(e.request, cacheToUse))
  }
})

async function tryCache(req: Request, cacheName: string) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(req)
  if (cached) {
    // console.log(`[vite:sw] serving ${req.url} from cache`)
    return cached
  } else {
    // console.log(`[vite:sw] fetching`, req)
    const res = await fetch(req)
    // console.log(`[vite:sw] got res:`, res)
    if (!res || res.status !== 200 || res.type !== 'basic') {
      // console.log(`not caching ${req.url}`)
      return res
    }
    // console.log(`[vite:sw] caching ${req.url}`)
    cache.put(req, res.clone())
    return res
  }
}

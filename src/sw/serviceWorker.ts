// These two are injected by the server on the fly so that we invalidate the
// cache when the server restarts, or when the user lockfile has changed.
const __SERVER_TIMESTAMP__ = 1
const __LOCKFILE_HASH__ = 'a'

const CACHE_NAME = `vite-cache-${__SERVER_TIMESTAMP__ + __LOCKFILE_HASH__}`

const sw = (self as any) as ServiceWorkerGlobalScope

sw.addEventListener('install', () => {
  sw.skipWaiting()
})

sw.addEventListener('activate', (e) => {
  sw.clients.claim()
  // delete any non-matching caches
  e.waitUntil(
    (async () => {
      const keys = await caches.keys()
      for (const key of keys) {
        if (key !== CACHE_NAME) {
          await caches.delete(key)
        }
      }
    })()
  )
})

sw.addEventListener('message', async (e) => {
  if (e.data.type === 'bust-cache') {
    const cache = await caches.open(CACHE_NAME)
    // console.log(`busted cache for ${e.data.path}`)
    cache.delete(e.data.path)
  }
})

const cacheableRequestRE = /^\/@modules\/|\.vue($|\?)|\.(t|j)sx?$|\.css$/
const hmrRequestRE = /(&|\?)t=\d+/

sw.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (
    cacheableRequestRE.test(url.pathname) &&
    // no need to cache hmr update requests
    !url.search.match(hmrRequestRE)
  ) {
    e.respondWith(tryCache(e.request))
  }
})

async function tryCache(req: Request) {
  const cached = await caches.match(req)
  if (cached) {
    // console.log(`serving ${req.url} from cache`)
    return cached
  } else {
    // console.log(`fetching`, req)
    const res = await fetch(req)
    // console.log(`got res:`, res)
    if (!res || res.status !== 200 || res.type !== 'basic') {
      // console.log(`not caching ${req.url}`)
      return res
    }
    // console.log(`caching ${req.url}`)
    const cache = await caches.open(CACHE_NAME)
    cache.put(req, res.clone())
    return res
  }
}

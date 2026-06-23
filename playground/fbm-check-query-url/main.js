// General (non-CSS) `?url` imported from JS — mirrors Vite's `playground/assets`
// "?url import" case (index.html: `import fooUrl from './foo.js?url'`; spec asserts
// `.url` text matches the dev server URL for foo.js).
//
// With `?url`, the import returns a URL STRING pointing at the file (NOT the file's
// contents, NOT its evaluated module). So:
//   - `sampleUrl` must be a URL string, and
//   - fetch(sampleUrl) must return the file's bytes (the strongest resolution check —
//     this is what catches a __ROLLDOWN_ASSET__/__VITE_ASSET__ placeholder or a 404).
//
// `sample.js` is >4096 B so it takes the EMITTED-ASSET path under FBM (the asset-URL
// path the FBM milestone cares about), not the trivial inline-data-URI path.
import sampleUrl from './sample.js?url'

// Render the URL value so the spec can assert its shape.
document.querySelector('.url-value').textContent = sampleUrl

// Fetch the URL and render the served body, so the spec can assert the URL resolves
// to the real file contents (catches an unresolved placeholder or a 404).
async function renderFetched(href) {
  try {
    const res = await fetch(href)
    const body = res.ok ? await res.text() : `FETCH_FAILED ${res.status}`
    document.querySelector('.url-fetched').textContent = body
  } catch (e) {
    document.querySelector('.url-fetched').textContent = `FETCH_THREW ${e}`
  }
}
renderFetched(sampleUrl)

document.querySelector('.app').textContent = 'query-url loaded'

// Re-render whenever the `?url` module re-evaluates (HMR). Mirrors how a real consumer
// would react to the URL/content changing.
if (import.meta.hot) {
  import.meta.hot.accept('./sample.js?url', (mod) => {
    if (mod) {
      document.querySelector('.url-value').textContent = mod.default
      renderFetched(mod.default)
    }
  })
}

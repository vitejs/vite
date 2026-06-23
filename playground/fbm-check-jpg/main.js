// Static `.jpg` + `.jpeg` assets imported from JS — mirrors Vite's `playground/assets`
// "asset imports from js" case (index.html: `import url from './nested/asset.png';
// text('.asset-import-relative', url)`). This queue item covers BOTH extensions, which
// share the IDENTICAL extension-keyed asset pipeline, so we import one of each.
//
// `import jpgUrl from './sample.jpg'` / `import jpegUrl from './sample.jpeg'` each return
// a URL STRING pointing at the asset. Both samples are >4096 B, so each takes the
// EMITTED-asset path (a hashed `/assets/sample-<hash>.jpg|.jpeg`), not the small-file
// inline `data:` URI path.
//
// Vite's asset pipeline is EXTENSION-keyed, not content-validating, so `.jpg`/`.jpeg` can
// hold any bytes — here they hold KNOWN text content so the spec can assert the served
// bytes via fetch() and edit them with unique single-occurrence needles.
import jpgUrl from './sample.jpg'
import jpegUrl from './sample.jpeg'

// Render the URL values so the spec can assert their shape (real `/assets/...-<hash>.jpg`
// / `.jpeg` vs an unresolved `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder).
document.querySelector('.jpg-url').textContent = jpgUrl
document.querySelector('.jpeg-url').textContent = jpegUrl

// Fetch each URL and render the served asset body, so the spec can assert the URL
// resolves to the real bytes (this is what would catch a placeholder or a 404), and —
// after an HMR edit — whether the served bytes refresh or stay frozen.
async function renderFetched(href, sel) {
  try {
    const res = await fetch(href)
    const body = res.ok ? await res.text() : `FETCH_FAILED ${res.status}`
    document.querySelector(sel).textContent = body
  } catch (e) {
    document.querySelector(sel).textContent = `FETCH_THREW ${e}`
  }
}
renderFetched(jpgUrl, '.jpg-fetched')
renderFetched(jpegUrl, '.jpeg-fetched')

document.querySelector('.app').textContent = 'jpg+jpeg loaded'

// Re-render whenever an asset module re-evaluates (HMR). A static asset edit in Vite
// normally triggers a full reload; these accept blocks mirror how a consumer reacting to
// the URL/content changing would re-fetch, so an in-place hot update would also be caught.
if (import.meta.hot) {
  import.meta.hot.accept('./sample.jpg', (mod) => {
    if (mod) {
      document.querySelector('.jpg-url').textContent = mod.default
      renderFetched(mod.default, '.jpg-fetched')
    }
  })
  import.meta.hot.accept('./sample.jpeg', (mod) => {
    if (mod) {
      document.querySelector('.jpeg-url').textContent = mod.default
      renderFetched(mod.default, '.jpeg-fetched')
    }
  })
}

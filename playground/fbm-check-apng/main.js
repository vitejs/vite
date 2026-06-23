// Static `.apng` asset imported from JS — mirrors Vite's `playground/assets`
// "asset imports from js" case (index.html: `import url from './nested/asset.png';
// text('.asset-import-relative', url)`).
//
// `import apngUrl from './sample.apng'` returns a URL STRING pointing at the asset.
// `sample.apng` is >4096 B, so it takes the EMITTED-asset path (a hashed
// `/assets/sample-<hash>.apng`), not the small-file inline `data:` URI path.
//
// Vite's asset pipeline is EXTENSION-keyed, not content-validating, so `.apng` can hold
// any bytes — here it holds KNOWN text content so the spec can assert the served bytes
// via fetch() and edit them with a unique single-occurrence needle.
import apngUrl from './sample.apng'

// Render the URL value so the spec can assert its shape (real `/assets/...-<hash>.apng`
// vs an unresolved `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder).
document.querySelector('.apng-url').textContent = apngUrl

// Fetch the URL and render the served asset body, so the spec can assert the URL
// resolves to the real bytes (this is what would catch a placeholder or a 404), and —
// after an HMR edit — whether the served bytes refresh or stay frozen.
async function renderFetched(href) {
  try {
    const res = await fetch(href)
    const body = res.ok ? await res.text() : `FETCH_FAILED ${res.status}`
    document.querySelector('.apng-fetched').textContent = body
  } catch (e) {
    document.querySelector('.apng-fetched').textContent = `FETCH_THREW ${e}`
  }
}
renderFetched(apngUrl)

document.querySelector('.app').textContent = 'apng loaded'

// Re-render whenever the asset module re-evaluates (HMR). A static asset edit in Vite
// normally triggers a full reload; this accept block mirrors how a consumer reacting to
// the URL/content changing would re-fetch, so an in-place hot update would also be caught.
if (import.meta.hot) {
  import.meta.hot.accept('./sample.apng', (mod) => {
    if (mod) {
      document.querySelector('.apng-url').textContent = mod.default
      renderFetched(mod.default)
    }
  })
}

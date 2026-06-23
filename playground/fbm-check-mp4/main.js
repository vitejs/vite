// Static `.mp4` asset imported from JS — mirrors Vite's `playground/assets`
// "asset imports from js" case (index.html: `import url from './nested/asset.png';
// text('.asset-import-relative', url)`). `.mp4` is the FIRST media entry in
// `KNOWN_ASSET_TYPES` (constants.ts:164, directly after `'jxl'` :161 — the last image
// entry — under the `// media` comment), handled by the SAME extension-keyed asset
// pipeline as `.png`/`.jpg`/`.gif`/`.svg`/`.webp`/`.avif`/`.cur`/`.jxl`.
//
// `import mp4Url from './sample.mp4'` returns a URL STRING pointing at the asset.
// `sample.mp4` is >4096 B, so it takes the EMITTED-asset path (a hashed
// `/assets/sample-<hash>.mp4`), not the small-file inline `data:` URI path.
//
// Vite's asset pipeline is EXTENSION-keyed, not content-validating, so `.mp4` can hold
// any bytes — here it holds KNOWN text content so the spec can assert the served bytes
// via fetch() and edit them with a unique single-occurrence needle.
import mp4Url from './sample.mp4'

// Render the URL value so the spec can assert its shape (real `/assets/...-<hash>.mp4`
// vs an unresolved `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder).
document.querySelector('.mp4-url').textContent = mp4Url

// Fetch the URL and render the served asset body, so the spec can assert the URL
// resolves to the real bytes (this is what would catch a placeholder or a 404), and —
// after an HMR edit — whether the served bytes refresh or stay frozen.
async function renderFetched(href) {
  try {
    const res = await fetch(href)
    const body = res.ok ? await res.text() : `FETCH_FAILED ${res.status}`
    document.querySelector('.mp4-fetched').textContent = body
  } catch (e) {
    document.querySelector('.mp4-fetched').textContent = `FETCH_THREW ${e}`
  }
}
renderFetched(mp4Url)

document.querySelector('.app').textContent = 'mp4 loaded'

// Re-render whenever the asset module re-evaluates (HMR). A static asset edit in Vite
// normally triggers a full reload; this accept block mirrors how a consumer reacting to
// the URL/content changing would re-fetch, so an in-place hot update would also be caught.
if (import.meta.hot) {
  import.meta.hot.accept('./sample.mp4', (mod) => {
    if (mod) {
      document.querySelector('.mp4-url').textContent = mod.default
      renderFetched(mod.default)
    }
  })
}

// Static `.avif` asset imported from JS — mirrors Vite's `playground/assets`
// "asset imports from js" case (index.html: `import url from './nested/asset.png';
// text('.asset-import-relative', url)`). `.avif` is listed in `KNOWN_ASSET_TYPES`
// (constants.ts:159, directly after `'webp'` :158 / `'ico'` :157 / `'svg'` :156),
// handled by the SAME extension-keyed asset pipeline as
// `.png`/`.jpg`/`.apng`/`.bmp`/`.gif`/`.svg`/`.ico`/`.webp`.
//
// `import avifUrl from './sample.avif'` returns a URL STRING pointing at the asset.
// `sample.avif` is >4096 B, so it takes the EMITTED-asset path (a hashed
// `/assets/sample-<hash>.avif`), not the small-file inline `data:` URI path.
//
// Vite's asset pipeline is EXTENSION-keyed, not content-validating, so `.avif` can hold
// any bytes — here it holds KNOWN text content so the spec can assert the served bytes
// via fetch() and edit them with a unique single-occurrence needle.
import avifUrl from './sample.avif'

// Render the URL value so the spec can assert its shape (real `/assets/...-<hash>.avif`
// vs an unresolved `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder).
document.querySelector('.avif-url').textContent = avifUrl

// Fetch the URL and render the served asset body, so the spec can assert the URL
// resolves to the real bytes (this is what would catch a placeholder or a 404), and —
// after an HMR edit — whether the served bytes refresh or stay frozen.
async function renderFetched(href) {
  try {
    const res = await fetch(href)
    const body = res.ok ? await res.text() : `FETCH_FAILED ${res.status}`
    document.querySelector('.avif-fetched').textContent = body
  } catch (e) {
    document.querySelector('.avif-fetched').textContent = `FETCH_THREW ${e}`
  }
}
renderFetched(avifUrl)

document.querySelector('.app').textContent = 'avif loaded'

// Re-render whenever the asset module re-evaluates (HMR). A static asset edit in Vite
// normally triggers a full reload; this accept block mirrors how a consumer reacting to
// the URL/content changing would re-fetch, so an in-place hot update would also be caught.
if (import.meta.hot) {
  import.meta.hot.accept('./sample.avif', (mod) => {
    if (mod) {
      document.querySelector('.avif-url').textContent = mod.default
      renderFetched(mod.default)
    }
  })
}

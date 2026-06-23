// Static `.otf` asset imported from JS — mirrors Vite's `playground/assets`
// "asset imports from js" case (index.html: `import url from './nested/asset.png';
// text('.asset-import-relative', url)`). `.otf` is a font entry in
// `KNOWN_ASSET_TYPES` (constants.ts:180, directly after `'ttf'` :179 under the
// `// fonts` comment :176), handled by the SAME extension-keyed asset pipeline as the
// font siblings `.woff`/`.woff2`/`.eot`/`.ttf` and the media/image clusters.
//
// `import otfUrl from './sample.otf'` returns a URL STRING pointing at the asset.
// `sample.otf` is >4096 B, so it takes the EMITTED-asset path (a hashed
// `/assets/sample-<hash>.otf`), not the small-file inline `data:` URI path.
//
// A real `.otf` is a binary OpenType font container, but Vite's asset pipeline is
// EXTENSION-KEYED (DEFAULT_ASSETS_RE constants.ts:188-189), not content-validating, so
// the bytes flow through the identical pipeline regardless of payload. The file holds an
// OTF sfnt signature ('OTTO') plus padding AND a unique single-occurrence marker so
// the spec can assert the served bytes via fetch() and edit them with a clean needle.
import otfUrl from './sample.otf'

// Render the URL value so the spec can assert its shape (real `/assets/...-<hash>.otf`
// vs an unresolved `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder).
document.querySelector('.otf-url').textContent = otfUrl

// Fetch the URL and render the served asset body, so the spec can assert the URL
// resolves to the real bytes (this is what would catch a placeholder or a 404), and —
// after an HMR edit — whether the served bytes refresh or stay frozen.
async function renderFetched(href) {
  try {
    const res = await fetch(href)
    const body = res.ok ? await res.text() : `FETCH_FAILED ${res.status}`
    document.querySelector('.otf-fetched').textContent = body
  } catch (e) {
    document.querySelector('.otf-fetched').textContent = `FETCH_THREW ${e}`
  }
}
renderFetched(otfUrl)

document.querySelector('.app').textContent = 'otf loaded'

// Re-render whenever the asset module re-evaluates (HMR). A static asset edit in Vite
// normally triggers a full reload; this accept block mirrors how a consumer reacting to
// the URL/content changing would re-fetch, so an in-place hot update would also be caught.
if (import.meta.hot) {
  import.meta.hot.accept('./sample.otf', (mod) => {
    if (mod) {
      document.querySelector('.otf-url').textContent = mod.default
      renderFetched(mod.default)
    }
  })
}

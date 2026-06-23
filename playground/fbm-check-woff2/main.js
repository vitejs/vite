// Static `.woff2` asset imported from JS — mirrors Vite's `playground/assets`
// "asset imports from js" case (index.html: `import url from './nested/asset.png';
// text('.asset-import-relative', url)`). `.woff2` shares the FIRST font entry in
// `KNOWN_ASSET_TYPES` (constants.ts:177, the `'woff2?'` token under the `// fonts`
// comment :176 — the `2?` makes the `2` optional so the single token matches BOTH
// `woff` and `woff2`), handled by the SAME extension-keyed asset pipeline as `.woff`,
// the media cluster `.vtt`/`.m4a`/`.mov`/`.opus`/`.aac`/`.flac`/`.wav`/`.mp3`/`.ogg`/`.webm`/`.mp4`
// and the image cluster `.png`/`.jpg`/`.gif`/`.svg`/`.webp`/`.avif`/`.cur`/`.jxl`.
//
// `import woff2Url from './sample.woff2'` returns a URL STRING pointing at the asset.
// `sample.woff2` is >4096 B, so it takes the EMITTED-asset path (a hashed
// `/assets/sample-<hash>.woff2`), not the small-file inline `data:` URI path.
//
// A real `.woff2` is a binary font container, but Vite's asset pipeline is
// EXTENSION-KEYED (DEFAULT_ASSETS_RE constants.ts:188-189), not content-validating, so
// the bytes flow through the identical pipeline regardless of payload. The file holds a
// WOFF2-ish signature plus padding AND a unique single-occurrence marker so the spec can
// assert the served bytes via fetch() and edit them with a clean needle.
import woff2Url from './sample.woff2'

// Render the URL value so the spec can assert its shape (real `/assets/...-<hash>.woff2`
// vs an unresolved `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder).
document.querySelector('.woff2-url').textContent = woff2Url

// Fetch the URL and render the served asset body, so the spec can assert the URL
// resolves to the real bytes (this is what would catch a placeholder or a 404), and —
// after an HMR edit — whether the served bytes refresh or stay frozen.
async function renderFetched(href) {
  try {
    const res = await fetch(href)
    const body = res.ok ? await res.text() : `FETCH_FAILED ${res.status}`
    document.querySelector('.woff2-fetched').textContent = body
  } catch (e) {
    document.querySelector('.woff2-fetched').textContent = `FETCH_THREW ${e}`
  }
}
renderFetched(woff2Url)

document.querySelector('.app').textContent = 'woff2 loaded'

// Re-render whenever the asset module re-evaluates (HMR). A static asset edit in Vite
// normally triggers a full reload; this accept block mirrors how a consumer reacting to
// the URL/content changing would re-fetch, so an in-place hot update would also be caught.
if (import.meta.hot) {
  import.meta.hot.accept('./sample.woff2', (mod) => {
    if (mod) {
      document.querySelector('.woff2-url').textContent = mod.default
      renderFetched(mod.default)
    }
  })
}

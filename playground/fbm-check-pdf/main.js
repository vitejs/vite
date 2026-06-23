// Static `.pdf` asset imported from JS — mirrors Vite's `playground/assets`
// "asset imports from js" case (index.html: `import url from './nested/asset.png';
// text('.asset-import-relative', url)`). `.pdf` sits in the `// other` group of
// `KNOWN_ASSET_TYPES` (constants.ts:184, directly after `'webmanifest'` :183, before
// `'txt'` :185, under the `// other` comment :182, after the fonts cluster `'otf'`
// :180), handled by the SAME extension-keyed asset pipeline as the font siblings
// `.woff`/`.woff2`/`.eot`/`.ttf`/`.otf`, the `.webmanifest` sibling, and the
// media/image clusters.
//
// `import u from './sample.pdf'` returns a URL STRING pointing at the asset (the
// static-asset pipeline owns the extension), NOT the parsed PDF.
//
// `sample.pdf` is >4096 B, so it takes the EMITTED-asset path (a hashed
// `/assets/sample-<hash>.pdf`), not the small-file inline `data:` URI path.
//
// Vite's asset pipeline is EXTENSION-KEYED (DEFAULT_ASSETS_RE constants.ts:188-189),
// not content-validating, so the bytes flow through the identical pipeline. The file is
// a valid PDF document, padded >4096 B, holding a UNIQUE single-occurrence marker so the
// spec can assert the served bytes via fetch() and edit them with a clean needle.
import u from './sample.pdf'

// Render the URL value so the spec can assert its shape (real
// `/assets/...-<hash>.pdf` vs an unresolved
// `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder).
document.querySelector('.pdf-url').textContent = u

// Fetch the URL and render the served asset body, so the spec can assert the URL
// resolves to the real bytes (this is what would catch a placeholder or a 404), and —
// after an HMR edit — whether the served bytes refresh or stay frozen.
async function renderFetched(href) {
  try {
    const res = await fetch(href)
    const body = res.ok ? await res.text() : `FETCH_FAILED ${res.status}`
    document.querySelector('.pdf-fetched').textContent = body
  } catch (e) {
    document.querySelector('.pdf-fetched').textContent = `FETCH_THREW ${e}`
  }
}
renderFetched(u)

document.querySelector('.app').textContent = 'pdf loaded'

// Re-render whenever the asset module re-evaluates (HMR). A static asset edit in Vite
// normally triggers a full reload; this accept block mirrors how a consumer reacting to
// the URL/content changing would re-fetch, so an in-place hot update would also be caught.
if (import.meta.hot) {
  import.meta.hot.accept('./sample.pdf', (mod) => {
    if (mod) {
      document.querySelector('.pdf-url').textContent = mod.default
      renderFetched(mod.default)
    }
  })
}

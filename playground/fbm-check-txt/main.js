// Static `.txt` asset imported from JS — mirrors Vite's `playground/assets`
// "asset imports from js" case (index.html: `import url from './nested/asset.png';
// text('.asset-import-relative', url)`). `.txt` sits LAST in the `// other` group of
// `KNOWN_ASSET_TYPES` (constants.ts:185, directly after `'pdf'` :184, under the
// `// other` comment :182, after the fonts cluster `'otf'` :180), handled by the SAME
// extension-keyed asset pipeline as the font siblings `.woff`/`.woff2`/`.eot`/`.ttf`/`.otf`,
// the `.webmanifest`/`.pdf` siblings, and the media/image clusters.
//
// CRITICAL `.txt` nuance: a DEFAULT import `import u from './sample.txt'` returns a URL
// STRING pointing at the static asset (the static-asset pipeline owns the extension) —
// NOT the parsed text content. Reading the TEXT content is the `?raw` query's job
// (asset.ts:150 / asset.ts:241 set moduleType:'js' to avoid a double `export default`
// "in `.txt`s"). So this is the asset-URL case, identical in shape to `.png`/`.pdf`.
//
// `sample.txt` is >4096 B, so it takes the EMITTED-asset path (a hashed
// `/assets/sample-<hash>.txt`), not the small-file inline `data:` URI path.
//
// Vite's asset pipeline is EXTENSION-KEYED (DEFAULT_ASSETS_RE constants.ts:188-189),
// not content-validating, so the bytes flow through the identical pipeline. The file
// holds a UNIQUE single-occurrence marker so the spec can assert the served bytes via
// fetch() and edit them with a clean needle (V1->V2 keeps the same byte length).
import u from './sample.txt'

// Render the URL value so the spec can assert its shape (real
// `/assets/...-<hash>.txt` vs an unresolved
// `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder).
document.querySelector('.txt-url').textContent = u

// Fetch the URL and render the served asset body, so the spec can assert the URL
// resolves to the real bytes (this is what would catch a placeholder or a 404), and —
// after an HMR edit — whether the served bytes refresh or stay frozen.
async function renderFetched(href) {
  try {
    const res = await fetch(href)
    const body = res.ok ? await res.text() : `FETCH_FAILED ${res.status}`
    document.querySelector('.txt-fetched').textContent = body
  } catch (e) {
    document.querySelector('.txt-fetched').textContent = `FETCH_THREW ${e}`
  }
}
renderFetched(u)

document.querySelector('.app').textContent = 'txt loaded'

// Re-render whenever the asset module re-evaluates (HMR). A static asset edit in Vite
// normally triggers a full reload; this accept block mirrors how a consumer reacting to
// the URL/content changing would re-fetch, so an in-place hot update would also be caught.
if (import.meta.hot) {
  import.meta.hot.accept('./sample.txt', (mod) => {
    if (mod) {
      document.querySelector('.txt-url').textContent = mod.default
      renderFetched(mod.default)
    }
  })
}

// Static `.svg` asset imported from JS — mirrors Vite's `playground/assets`
// SVG URL-import case (index.html: `import svgFrag from './nested/fragment.svg';
// text('.svg-frag-import-path', svgFrag)` + the `?no-inline svg import` test,
// assets.spec.ts L501-507). `.svg` is in `KNOWN_ASSET_TYPES` (constants.ts:156),
// but the asset plugin has SVG-SPECIFIC handling: a SMALL svg (<4096 B, no `#`
// fragment) is INLINED as a URL-encoded `data:image/svg+xml,...` data URI via
// `svgToDataURL` (asset.ts:351-356, 579-580, 591-610); a `>=4096 B` svg takes the
// SAME emitted-asset path as `.png`/`.gif` (a hashed `/assets/sample-<hash>.svg`).
//
// `sample.svg` is a valid SVG XML document, >=4096 B and carries NO `#` fragment,
// so it deliberately exercises the EMITTED-asset path (the one the FBM milestone
// cares about, and the one that froze for CSS `?url` / `.apng` / `.bmp` / `.png` /
// `.gif`), NOT the small-svg data-URI inline path.
//
// `import svgUrl from './sample.svg'` returns a URL STRING pointing at the asset.
// The unique marker `SVG-FBM-MARKER-V1` lives as a single-occurrence element id
// attribute (NOT in a comment), so the spec can fetch-assert the served bytes and
// edit them with a clean single-occurrence needle.
import svgUrl from './sample.svg'

// Render the URL value so the spec can assert its shape (real `/assets/...-<hash>.svg`
// vs an unresolved `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder vs a `data:` URI).
document.querySelector('.svg-url').textContent = svgUrl

// Fetch the URL and render the served asset body, so the spec can assert the URL
// resolves to the real bytes (this is what would catch a placeholder or a 404), and —
// after an HMR edit — whether the served bytes refresh or stay frozen.
async function renderFetched(href) {
  try {
    const res = await fetch(href, { cache: 'no-store' })
    const body = res.ok ? await res.text() : `FETCH_FAILED ${res.status}`
    document.querySelector('.svg-fetched').textContent = body
  } catch (e) {
    document.querySelector('.svg-fetched').textContent = `FETCH_THREW ${e}`
  }
}
renderFetched(svgUrl)

document.querySelector('.app').textContent = 'svg loaded'

// Re-render whenever the asset module re-evaluates (HMR). A static asset edit in Vite
// normally triggers a full reload; this accept block mirrors how a consumer reacting to
// the URL/content changing would re-fetch, so an in-place hot update would also be caught.
if (import.meta.hot) {
  import.meta.hot.accept('./sample.svg', (mod) => {
    if (mod) {
      document.querySelector('.svg-url').textContent = mod.default
      renderFetched(mod.default)
    }
  })
}

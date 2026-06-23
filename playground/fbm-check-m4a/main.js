// Static `.m4a` asset imported from JS — mirrors Vite's `playground/assets`
// "asset imports from js" case (index.html: `import url from './nested/asset.png';
// text('.asset-import-relative', url)`). `.m4a` is the TENTH media entry in
// `KNOWN_ASSET_TYPES` (constants.ts:173, directly after `'mov'` :172 / `'opus'` :171 /
// `'aac'` :170 under the `// media` comment :163), handled by the SAME extension-keyed
// asset pipeline as `.mov`/`.opus`/`.aac`/`.flac`/`.wav`/`.mp3`/`.ogg`/`.webm`/`.mp4`/the image cluster.
//
// `import m4aUrl from './sample.m4a'` returns a URL STRING pointing at the asset.
// `sample.m4a` is >4096 B, so it takes the EMITTED-asset path (a hashed
// `/assets/sample-<hash>.m4a`), not the small-file inline `data:` URI path.
//
// Vite's asset pipeline is EXTENSION-keyed, not content-validating, so `.m4a` can hold
// any bytes — here it holds KNOWN text content so the spec can assert the served bytes
// via fetch() and edit them with a unique single-occurrence needle.
import m4aUrl from './sample.m4a'

// Render the URL value so the spec can assert its shape (real `/assets/...-<hash>.m4a`
// vs an unresolved `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder).
document.querySelector('.m4a-url').textContent = m4aUrl

// Fetch the URL and render the served asset body, so the spec can assert the URL
// resolves to the real bytes (this is what would catch a placeholder or a 404), and —
// after an HMR edit — whether the served bytes refresh or stay frozen.
async function renderFetched(href) {
  try {
    const res = await fetch(href)
    const body = res.ok ? await res.text() : `FETCH_FAILED ${res.status}`
    document.querySelector('.m4a-fetched').textContent = body
  } catch (e) {
    document.querySelector('.m4a-fetched').textContent = `FETCH_THREW ${e}`
  }
}
renderFetched(m4aUrl)

document.querySelector('.app').textContent = 'm4a loaded'

// Re-render whenever the asset module re-evaluates (HMR). A static asset edit in Vite
// normally triggers a full reload; this accept block mirrors how a consumer reacting to
// the URL/content changing would re-fetch, so an in-place hot update would also be caught.
if (import.meta.hot) {
  import.meta.hot.accept('./sample.m4a', (mod) => {
    if (mod) {
      document.querySelector('.m4a-url').textContent = mod.default
      renderFetched(mod.default)
    }
  })
}

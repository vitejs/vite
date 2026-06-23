// `?inline` and `?no-inline` query suffixes — mirrors Vite's `playground/assets`
// cases (index.html L566-573):
//   `import noInlineSvg from './nested/fragment.svg?no-inline'; text('.no-inline-svg', noInlineSvg)`
//   `import inlinePng from './nested/asset.png?inline'; text('.inline-png', inlinePng)`
//
// `?inline` FORCES the asset to be inlined as a `data:...` URI baked into the JS
//   module (regardless of file size). The value lives IN the JS module as a string.
// `?no-inline` FORCES the emitted-asset path (a real `/assets/...-<hash>` URL) even
//   for a small file that would normally inline by size. The value is an asset URL.
//
// Both source SVGs are tiny (<4096 B), so the ONLY thing deciding inline-vs-emit here
// is the query suffix — not the size (shouldInline: noInlineRE -> false, inlineRE ->
// true, before the size check; asset.ts:545-546).
import inlineUrl from './inline.svg?inline'
import noinlineUrl from './noinline.svg?no-inline'

// Render the ?inline data URI so the spec can assert its shape + decode the marker.
document.querySelector('.inline-value').textContent = inlineUrl

// Render the ?no-inline URL so the spec can assert it is a real emitted asset URL.
document.querySelector('.noinline-value').textContent = noinlineUrl

// Fetch the ?no-inline URL and render the served body, so the spec can assert the URL
// resolves to the real file contents (catches an unresolved placeholder or a 404), and
// — on HMR — whether the served content is fresh or frozen.
async function renderFetched(href) {
  try {
    const res = await fetch(href)
    const body = res.ok ? await res.text() : `FETCH_FAILED ${res.status}`
    document.querySelector('.noinline-fetched').textContent = body
  } catch (e) {
    document.querySelector('.noinline-fetched').textContent = `FETCH_THREW ${e}`
  }
}
renderFetched(noinlineUrl)

document.querySelector('.app').textContent = 'query-inline loaded'

// Re-render whenever either `?inline` / `?no-inline` module re-evaluates (HMR). A real
// consumer would react to the data URI / URL changing.
if (import.meta.hot) {
  import.meta.hot.accept('./inline.svg?inline', (mod) => {
    if (mod) {
      document.querySelector('.inline-value').textContent = mod.default
    }
  })
  import.meta.hot.accept('./noinline.svg?no-inline', (mod) => {
    if (mod) {
      document.querySelector('.noinline-value').textContent = mod.default
      renderFetched(mod.default)
    }
  })
}

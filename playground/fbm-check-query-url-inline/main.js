// `?url&inline` and `?url&no-inline` query-suffix COMBINATIONS — mirrors Vite's
// playground/assets `?url&inline` case (index.html L578-579:
//   `import inlinePublicJson from '/foo.json?url&inline'; text('.inline-public-json', …)`
// asserted to be a `data:application/json;base64,` URI, assets.spec.ts L529-533) and the
// closest `?url`/`?no-inline` emitted-asset cases (assets.spec.ts L501-507, L535-542).
//
// The combos:
//   `?url&inline`   -> `?url` carries the import to the asset/url branch (asset.ts:217-243),
//     and `inline` makes `shouldInline` return TRUE (inlineRE, asset.ts:546, BEFORE the size
//     check) -> `assetToDataURL` -> a `data:` URI BAKED INTO the JS module as a string. So
//     `inline` WINS: the imported value is a data URI (NOT an /assets/ URL), regardless of
//     file size.
//   `?url&no-inline` -> same asset/url branch, but `no-inline` makes `shouldInline` return
//     FALSE (noInlineRE, asset.ts:545) -> `emitFile` -> a real emitted `/assets/...-<hash>`
//     URL even for a tiny file. So `no-inline` WINS: the imported value is a real asset URL
//     (NOT a data URI).
//
// Both source SVGs are tiny (<4096 B) so the SUFFIX — not the size — decides inline-vs-emit.
// Note: `?url` here is redundant with the asset/url branch (which `?inline`/`?no-inline`
// already route through), so these combos are expected to behave identically to the plain
// `?inline` / `?no-inline` cases (see RESULT.md §4 `?inline` / `?no-inline`).
import a from './urlinline.svg?url&inline'
import b from './urlnoinline.svg?url&no-inline'

// Render the ?url&inline data URI so the spec can assert its shape + decode the marker.
document.querySelector('.urlinline-value').textContent = a

// Render the ?url&no-inline URL so the spec can assert it is a real emitted asset URL.
document.querySelector('.urlnoinline-value').textContent = b

// Fetch the ?url&no-inline URL and render the served body, so the spec can assert the URL
// resolves to the real file contents (catches an unresolved placeholder or a 404), and —
// on HMR — whether the served content is fresh or frozen.
async function renderFetched(href) {
  try {
    const res = await fetch(href)
    const body = res.ok ? await res.text() : `FETCH_FAILED ${res.status}`
    document.querySelector('.urlnoinline-fetched').textContent = body
  } catch (e) {
    document.querySelector('.urlnoinline-fetched').textContent =
      `FETCH_THREW ${e}`
  }
}
renderFetched(b)

document.querySelector('.app').textContent = 'query-url-inline loaded'

// Re-render whenever either combo module re-evaluates (HMR). A real consumer would react
// to the data URI / URL changing.
if (import.meta.hot) {
  import.meta.hot.accept('./urlinline.svg?url&inline', (mod) => {
    if (mod) {
      document.querySelector('.urlinline-value').textContent = mod.default
    }
  })
  import.meta.hot.accept('./urlnoinline.svg?url&no-inline', (mod) => {
    if (mod) {
      document.querySelector('.urlnoinline-value').textContent = mod.default
      renderFetched(mod.default)
    }
  })
}

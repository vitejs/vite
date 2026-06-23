// Static `.vtt` asset imported from JS — mirrors Vite's `playground/assets`
// "asset imports from js" case (index.html: `import url from './nested/asset.png';
// text('.asset-import-relative', url)`). `.vtt` is the LAST media entry in
// `KNOWN_ASSET_TYPES` (constants.ts:174, directly after `'m4a'` :173 / `'mov'` :172 /
// `'opus'` :171 under the `// media` comment :163), handled by the SAME extension-keyed
// asset pipeline as `.m4a`/`.mov`/`.opus`/`.aac`/`.flac`/`.wav`/`.mp3`/`.ogg`/`.webm`/`.mp4`/the image cluster.
//
// `import vttUrl from './sample.vtt'` returns a URL STRING pointing at the asset.
// `sample.vtt` is >4096 B, so it takes the EMITTED-asset path (a hashed
// `/assets/sample-<hash>.vtt`), not the small-file inline `data:` URI path.
//
// `.vtt` (WebVTT subtitles) is genuine text, so the file holds VALID WebVTT (a `WEBVTT`
// header + cues, padded) AND a unique single-occurrence marker so the spec can assert the
// served bytes via fetch() and edit them with a clean needle. The asset pipeline is
// extension-keyed, not content-validating — the bytes flow through the identical pipeline.
import vttUrl from './sample.vtt'

// Render the URL value so the spec can assert its shape (real `/assets/...-<hash>.vtt`
// vs an unresolved `__ROLLDOWN_ASSET__`/`__VITE_ASSET__` placeholder).
document.querySelector('.vtt-url').textContent = vttUrl

// Fetch the URL and render the served asset body, so the spec can assert the URL
// resolves to the real bytes (this is what would catch a placeholder or a 404), and —
// after an HMR edit — whether the served bytes refresh or stay frozen.
async function renderFetched(href) {
  try {
    const res = await fetch(href)
    const body = res.ok ? await res.text() : `FETCH_FAILED ${res.status}`
    document.querySelector('.vtt-fetched').textContent = body
  } catch (e) {
    document.querySelector('.vtt-fetched').textContent = `FETCH_THREW ${e}`
  }
}
renderFetched(vttUrl)

document.querySelector('.app').textContent = 'vtt loaded'

// Re-render whenever the asset module re-evaluates (HMR). A static asset edit in Vite
// normally triggers a full reload; this accept block mirrors how a consumer reacting to
// the URL/content changing would re-fetch, so an in-place hot update would also be caught.
if (import.meta.hot) {
  import.meta.hot.accept('./sample.vtt', (mod) => {
    if (mod) {
      document.querySelector('.vtt-url').textContent = mod.default
      renderFetched(mod.default)
    }
  })
}

// `new URL('./asset', import.meta.url)` ASSET form — mirrors Vite's
// `playground/assets` case (index.html L604-606:
//   `const metaUrl = new URL('./import-meta-url/img.png', import.meta.url)`,
//   `text('.import-meta-url', metaUrl)`), asserted by
//   `test('new URL(..., import.meta.url)')` (assets.spec.ts L571-597).
//
// Vite's `vite:asset-import-meta-url` plugin (plugins/assetImportMetaUrl.ts) rewrites the
// `new URL('./sample.png', import.meta.url)` call to the resolved asset URL. Under FBM the
// client env is `isBundled: true`, so `fileToUrl` takes the BUILD branch (`fileToBuiltUrl`)
// and emits a hashed `/assets/sample-<hash>.png`, NOT the live dev URL non-FBM dev uses.
//
// `sample.png` is >4096 B, so it takes the EMITTED-asset path (a real hashed asset), not
// the small-file inline `data:` URI path. Vite's asset pipeline is EXTENSION-keyed (not
// content-validating), so `.png` may hold any bytes; here it holds KNOWN text content so
// the spec can assert the served bytes via fetch() and edit them with a UNIQUE
// single-occurrence needle (`FBM-IMU-MARKER-V1`).
const url = new URL('./sample.png', import.meta.url)

// Render the resolved URL value so the spec can assert its shape (real
// `/assets/sample-<hash>.png` vs an unresolved `__ROLLDOWN_ASSET__`/`__VITE_ASSET__`
// placeholder, vs a raw `import.meta.url`-relative path that 404s).
document.querySelector('.imu-url').textContent = String(url)

// Fetch the URL and render the served asset body, so the spec can assert the URL resolves
// to the real bytes (this catches a placeholder or a 404), and — after an HMR edit —
// whether the served bytes refresh or stay frozen. Cache-bust so a frozen disk/HTTP cache
// can't masquerade as a refresh.
async function renderFetched(href) {
  try {
    const res = await fetch(href, { cache: 'no-store' })
    const body = res.ok ? await res.text() : `FETCH_FAILED ${res.status}`
    document.querySelector('.imu-fetched').textContent = body
  } catch (e) {
    document.querySelector('.imu-fetched').textContent = `FETCH_THREW ${e}`
  }
}
renderFetched(String(url))

document.querySelector('.app').textContent = 'imu loaded'

// Standalone Playwright repro for FBM Issue 3 — a plugin-injected `/@id/virtual:…`
// runtime entry point 404s under bundledDev. NO Vite test harness: we spawn the app's
// own `vite` dev server, drive it with Playwright, and report whether the virtual script
// the local `injectVirtualScript()` plugin injects loads (200, window.__overlayLoaded)
// or 404s.
//
// Toggle: default = FBM on (bundledDev: true); `--no-fbm` = baseline (sets VITE_NO_FBM=1).
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

let chromium
try {
  ;({ chromium } = await import('playwright-chromium'))
} catch {
  ;({ chromium } = await import('playwright'))
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const FBM = !process.argv.includes('--no-fbm') // default on; --no-fbm = baseline
const TAG = FBM ? '[FBM]' : '[baseline]'

const server = spawn('corepack', ['pnpm', 'dev'], {
  cwd: __dirname,
  env: { ...process.env, ...(FBM ? {} : { VITE_NO_FBM: '1' }) },
  stdio: ['ignore', 'pipe', 'pipe'],
})

let browser
let exited = false
async function cleanup(code) {
  if (exited) return
  exited = true
  await browser?.close().catch(() => {})
  server.kill('SIGTERM')
  process.exit(code)
}
const fail = (msg) => {
  console.error(`FAIL ${TAG}:`, msg)
  return cleanup(1)
}

// auto-port: parse the Local URL from stdout, never hard-code 5173
const url = await new Promise((res, rej) => {
  const t = setTimeout(
    () => rej(new Error('dev server did not print a URL in 60s')),
    60_000,
  )
  server.stdout.on('data', (b) => {
    const s = b.toString()
    process.stdout.write(s)
    const m = /(http:\/\/localhost:\d+\/?)/.exec(s)
    if (m) {
      clearTimeout(t)
      res(m[1])
    }
  })
  server.stderr.on('data', (b) => process.stderr.write(b))
}).catch((e) => fail(e.message))
if (!url) throw new Error('unreachable')

browser = await chromium.launch()
const page = await browser.newPage()

const consoleErrors = []
const pageErrors = []
const failedResponses = [] // 4xx/5xx
page.on('console', (m) => {
  if (m.type() === 'error' && !/favicon/.test(m.text()))
    consoleErrors.push(m.text())
})
page.on('pageerror', (e) => pageErrors.push(String(e)))
page.on('response', (r) => {
  const st = r.status()
  if (st >= 400) failedResponses.push({ status: st, url: r.url() })
})

async function run() {
  // FBM serves a "Bundling in progress" placeholder that auto-reloads once the initial
  // in-memory bundle is built — poll for the real app marker before asserting.
  await page.goto(url, { waitUntil: 'load' })
  try {
    await page.waitForFunction(() => window.__appBooted === true, null, {
      timeout: 20_000,
    })
  } catch {
    // fall through — we still report what we saw (the app may have failed to boot)
  }

  // Discover the exact /@id/ URL the plugin injected into the served HTML, so the report
  // names the real URL Vite generated (not a guess).
  const injectedSrc = await page
    .evaluate(() => {
      const s = [...document.querySelectorAll('script[type="module"]')].find(
        (el) => (el.getAttribute('src') || '').includes('my-overlay'),
      )
      return s ? s.getAttribute('src') : null
    })
    .catch(() => null)

  const appBooted = await page
    .evaluate(() => window.__appBooted === true)
    .catch(() => false)
  const overlayLoaded = await page
    .evaluate(() => window.__overlayLoaded === true)
    .catch(() => false)

  // the virtual-script response, if the browser fetched it
  const overlayResp = injectedSrc
    ? failedResponses.find((r) => r.url.endsWith(injectedSrc)) || null
    : failedResponses.find((r) => /my-overlay/.test(r.url)) || null

  const report = {
    fbm: FBM,
    injectedSrc,
    appBooted,
    overlayLoaded,
    overlay404: !!overlayResp,
    overlayStatus: overlayResp
      ? overlayResp.status
      : overlayLoaded
        ? 200
        : 'unknown',
    failedResponses,
    consoleErrors,
    pageErrors,
  }
  console.log(`RESULT ${TAG}: ` + JSON.stringify(report, null, 2))

  if (FBM) {
    // FBM EXPECTATION (the bug): overlay 404s and never loads.
    if (
      overlayLoaded ||
      (overlayResp == null && appBooted && failedResponses.length === 0)
    ) {
      return fail(
        `expected the virtual /@id script to 404 under FBM, but it loaded (overlayLoaded=${overlayLoaded}). ` +
          `Minimal plugin did NOT reproduce — fall back to vue-starter.`,
      )
    }
    console.log(
      `OK ${TAG}: virtual /@id script 404'd under FBM as expected (bug reproduced).`,
    )
  } else {
    // BASELINE EXPECTATION: overlay loads 200, no 404s.
    if (!overlayLoaded || overlayResp) {
      return fail(
        `baseline expected the virtual /@id script to load (200) with no 404, ` +
          `got overlayLoaded=${overlayLoaded}, overlay404=${!!overlayResp}.`,
      )
    }
    console.log(
      `OK ${TAG}: virtual /@id script loaded 200, window.__overlayLoaded=true (clean).`,
    )
  }
  return cleanup(0)
}

run().catch((e) => fail(e.stack || String(e)))

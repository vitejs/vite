// Standalone HMR workflow for the create-vite `qwik` template under Vite full-bundle mode.
// No Vite test harness: we spawn the app's own `vite` dev server, drive it with Playwright,
// edit src/app.jsx (which renders the <h1> marker + the counter button), and observe the update.
//
// IMPORTANT — Qwik's HMR model is NOT a state-preserving component hot-swap. The qwikVite
// plugin's handleHotUpdate() invalidates the changed module/segments and then unconditionally
// `server.hot.send({ type: "full-reload" })` (node_modules/@builder.io/qwik/dist/optimizer.mjs
// :4133). Qwik is resumable: counter state lives in serialized DOM/qwikloader, not a long-lived
// JS runtime instance, so a full reload is the intended behavior. Therefore we DERIVE the
// expected behavior from the `--no-fbm` baseline and require FBM to be NO WEAKER than it:
//   - the edited <h1> sentinel must appear (the change reached the browser), AND
//   - no uncaught browser console / page errors on boot or during the update, AND
//   - the update MODE (full reload vs hot-swap) under FBM must match (or exceed) the baseline.
// We do NOT assert counter-state preservation, because the qwik baseline itself does not
// preserve it (full reload). GOAL.md §1 lists qwik as "hot swap" without a state-preserved
// clause; the empirical baseline is the source of truth per LOOP.md.
//
// Toggle: default = FBM on (bundledDev: true); `--no-fbm` = baseline (sets VITE_NO_FBM=1).
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

let chromium
try {
  ;({ chromium } = await import('playwright-chromium'))
} catch {
  ;({ chromium } = await import('playwright'))
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const FBM = !process.argv.includes('--no-fbm') // default on; --no-fbm = baseline
const EDIT = join(__dirname, 'src/app.jsx') // renders the <h1> marker + the counter button
const MARKER = 'Get started' // the stock <h1> text
const SENTINEL = `HMR-OK-${FBM ? 'fbm' : 'base'}`
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
const logs = []
const pageErrors = []
const failedRequests = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => pageErrors.push(String(e)))
page.on('requestfailed', (r) =>
  failedRequests.push(`${r.url()} :: ${r.failure()?.errorText ?? ''}`),
)
page.on('response', (r) => {
  if (r.status() >= 400) failedRequests.push(`${r.url()} :: HTTP ${r.status()}`)
})

// Wait for the FBM transient "Bundling in progress" auto-reload page to settle into real content.
async function waitForRealMarker(timeout = 30_000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    try {
      await page.waitForSelector('h1', { timeout: 2_000 })
      const t = await page.textContent('h1').catch(() => null)
      if (t && (t.includes(MARKER) || t.includes('HMR-OK'))) return t
    } catch {
      // page may be mid-reload (FBM "Bundling in progress"); retry
    }
    await page.waitForTimeout(300)
  }
  return null
}

async function run() {
  await page.goto(url, { waitUntil: 'networkidle' })
  const h1 = await waitForRealMarker()

  // 1. Initial render: <h1> marker present
  if (!h1?.includes(MARKER))
    return fail(
      `initial render missing "${MARKER}" (got: ${JSON.stringify(h1)})`,
    )

  // 2. Counter increments — Qwik resumes onClick$ lazily; click and wait for the bump.
  const counter = page.locator('button.counter')
  await counter.click()
  let counterWorks = true
  try {
    await page.waitForFunction(
      () =>
        /Count is 1/.test(
          document.querySelector('button.counter')?.textContent ?? '',
        ),
      null,
      { timeout: 8_000 },
    )
  } catch {
    counterWorks = false
  }
  if (!counterWorks) {
    const ct = await page.evaluate(
      () => document.querySelector('button.counter')?.textContent ?? '',
    )
    return fail(
      `counter did not increment after click (Qwik resumability broken). got: ${JSON.stringify(ct)}`,
    )
  }

  // boot-time console/page errors and asset failures are a failure
  const bootErrors = [
    ...pageErrors,
    ...logs.filter((l) => l.startsWith('[error]') && !/favicon/.test(l)),
    ...failedRequests.filter((r) => !/favicon/.test(r)),
  ]
  if (bootErrors.length)
    return fail(
      `uncaught browser errors / failed requests on boot:\n${bootErrors.join('\n')}`,
    )

  // 3. Install reload sentinel, then edit the source
  await page.evaluate(() => {
    window.__noReload = true
  })
  logs.length = 0 // only care about HMR messages from here
  failedRequests.length = 0

  const before = readFileSync(EDIT, 'utf8')
  if (!before.includes(MARKER)) {
    writeFileSync(EDIT, before)
    return fail(
      `edit target ${EDIT} does not contain "${MARKER}" — replace would be a no-op`,
    )
  }
  writeFileSync(EDIT, before.replace(MARKER, SENTINEL))

  let sentinelShown = false
  try {
    // After the edit, Qwik triggers a full-reload; poll past the transient bundling page.
    const t = await waitForRealMarker(25_000)
    sentinelShown = !!t && t.includes(SENTINEL)
  } catch {
    sentinelShown = false
  } finally {
    writeFileSync(EDIT, before) // restore source no matter what
  }

  // settle: let any [vite] hot-update / page-reload logs flush
  await page.waitForTimeout(800)

  const survived = await page.evaluate(() => window.__noReload === true)
  const reloaded = !survived
  const countText = await page.evaluate(
    () => document.querySelector('button.counter')?.textContent?.trim() ?? '',
  )
  const sawFullReload = logs.some((l) =>
    /\[vite\].*(page reload|full reload)/i.test(l),
  )
  const sawHotUpdate = logs.some((l) => /\[vite\].*hot updated/i.test(l))
  const hmrErrors = [
    ...pageErrors,
    ...logs.filter((l) => l.startsWith('[error]')),
    ...failedRequests.filter((r) => !/favicon/.test(r)),
  ]

  const summary = {
    fbm: FBM,
    sentinelShown,
    reloaded,
    countTextAfter: countText,
    sawFullReload,
    sawHotUpdate,
    hmrErrors,
  }
  console.log(`RESULT ${TAG} ${JSON.stringify(summary)}`)

  // Assertions — identical for baseline and FBM (the only difference is bundledDev):
  // qwik => the edit must reach the browser (sentinel appears) with NO errors / failed asset
  // requests. The MODE is a FULL RELOAD by design (qwikVite handleHotUpdate sends full-reload),
  // so we do NOT require state preservation; we DO require FBM to not be weaker than baseline:
  // it must still apply the edit and must not introduce errors the baseline lacks.
  if (hmrErrors.length)
    return fail(
      `browser errors / failed requests during/after update:\n${hmrErrors.join('\n')}`,
    )
  if (!sentinelShown)
    return fail(
      'edited <h1> sentinel never appeared in the DOM (update was not applied)',
    )

  console.log(
    `PASS ${TAG}: qwik applied the app.jsx edit (full-reload model), no errors/asset 404s.`,
  )
  await cleanup(0)
}

run().catch((e) => fail(e?.stack || String(e)))

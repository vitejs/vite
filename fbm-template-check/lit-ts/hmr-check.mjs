// Standalone HMR workflow for the create-vite `lit-ts` template under Vite full-bundle mode.
// No Vite test harness: we spawn the app's own `vite` dev server, drive it with Playwright,
// edit a string rendered INSIDE src/my-element.ts, and assert the update.
//
// ⚠️ lit specifics (per GOAL.md):
//   - the `<h1>Get started</h1>` marker lives in index.html (slotted light-DOM), NOT in the
//     component — so we DON'T edit/assert on it.
//   - the counter `button` ("Count is N") is in the component's SHADOW DOM — we query it via
//     document.querySelector('my-element').shadowRoot.
//   - Lit has no official HMR, so the correct baseline outcome is a CLEAN FULL RELOAD:
//       * the edited shadow-DOM sentinel appears (the new module was served), AND
//       * the page actually reloaded (window.__noReload sentinel is gone), i.e. NOT a hot-swap.
// We derive the baseline by running `--no-fbm` first; the FBM run must MATCH it (not be weaker:
// a clean reload with no error — we do NOT demand a hot-swap lit does not do).
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
const EDIT = join(__dirname, 'src/my-element.ts') // renders the shadow-DOM "Count is N" button
const MARKER = 'Count is' // the rendered count label inside the component's shadow DOM
const SENTINEL = `HMR-OK-${FBM ? 'fbm' : 'base'}` // replaces "Count is" → e.g. "HMR-OK-fbm 1"
const TAG = FBM ? '[FBM]' : '[baseline]'

// query helpers that reach into <my-element>.shadowRoot
const shadowText = (sel) =>
  `(() => { const el = document.querySelector('my-element'); const n = el && el.shadowRoot && el.shadowRoot.querySelector('${sel}'); return n ? n.textContent : null })()`

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
const responses = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => pageErrors.push(String(e)))
page.on('response', (r) => responses.push({ status: r.status(), url: r.url() }))

async function run() {
  await page.goto(url, { waitUntil: 'networkidle' })
  // wait for the custom element to upgrade and its shadow root to render the button
  await page.waitForFunction(
    (MARKER) => {
      const el = document.querySelector('my-element')
      return !!(
        el &&
        el.shadowRoot &&
        el.shadowRoot
          .querySelector('button.counter')
          ?.textContent?.includes(MARKER)
      )
    },
    MARKER,
    { timeout: 15_000 },
  )

  // 1. Initial render: light-DOM <h1> marker (slotted) present, shadow-DOM button present
  const h1 = await page.textContent('h1')
  if (!h1?.includes('Get started'))
    return fail(
      `initial render missing slotted "<h1>Get started</h1>" (got: ${JSON.stringify(h1)})`,
    )
  const btn0 = await page.evaluate(shadowText('button.counter'))
  if (!btn0?.includes('Count is 0'))
    return fail(
      `shadow-DOM counter missing "Count is 0" (got: ${JSON.stringify(btn0)})`,
    )

  // 2. Counter increments (state lives on the component instance)
  await page.evaluate(() =>
    document
      .querySelector('my-element')
      .shadowRoot.querySelector('button.counter')
      .click(),
  )
  await page.waitForFunction(
    () => {
      const el = document.querySelector('my-element')
      return /Count is 1/.test(
        el?.shadowRoot?.querySelector('button.counter')?.textContent ?? '',
      )
    },
    null,
    { timeout: 5_000 },
  )

  // boot-time uncaught console errors are a failure (ignore favicon noise)
  const bootErrors = [
    ...pageErrors,
    ...logs.filter((l) => l.startsWith('[error]') && !/favicon/.test(l)),
  ]
  if (bootErrors.length)
    return fail(`uncaught browser errors on boot:\n${bootErrors.join('\n')}`)

  // asset check: hero.png / lit.svg / vite.svg are imported by my-element.ts and become
  // `__ROLLDOWN_ASSET__#<refId>` placeholders that FBM must resolve (cf. vitejs/vite#22596).
  const badAssets = responses.filter(
    (r) => r.status >= 400 && /\.(png|svg)(\?|$)/.test(r.url),
  )
  if (badAssets.length)
    return fail(
      `asset 4xx (unresolved placeholder?):\n${badAssets.map((r) => `${r.status} ${r.url}`).join('\n')}`,
    )

  // 3. Install reload sentinel, then edit the source
  await page.evaluate(() => {
    window.__noReload = true
  })
  logs.length = 0 // only care about HMR messages from here

  const before = readFileSync(EDIT, 'utf8')
  if (!before.includes(MARKER)) {
    writeFileSync(EDIT, before)
    return fail(
      `edit target ${EDIT} does not contain "${MARKER}" — replace would be a no-op`,
    )
  }
  // replace the rendered label "Count is" → sentinel; the button becomes "HMR-OK-xxx N"
  writeFileSync(EDIT, before.replace(MARKER, SENTINEL))

  let sentinelShown = false
  try {
    await page.waitForFunction(
      (s) => {
        const el = document.querySelector('my-element')
        return el?.shadowRoot
          ?.querySelector('button.counter')
          ?.textContent?.includes(s)
      },
      SENTINEL,
      { timeout: 20_000 },
    )
    sentinelShown = true
  } catch {
    sentinelShown = false
  } finally {
    writeFileSync(EDIT, before) // restore source no matter what
  }

  // settle: give the [vite] connected/reload logs a beat to flush after navigation
  await page.waitForTimeout(500)

  const survived = await page.evaluate(() => window.__noReload === true)
  const reloaded = !survived
  const sawFullReload = logs.some((l) =>
    /\[vite\].*(page reload|full reload)/i.test(l),
  )
  const sawHotUpdate = logs.some((l) => /\[vite\].*hot updated/i.test(l))
  const hmrErrors = [
    ...pageErrors,
    ...logs.filter((l) => l.startsWith('[error]')),
  ]

  const summary = {
    fbm: FBM,
    sentinelShown,
    reloaded,
    sawFullReload,
    sawHotUpdate,
    hmrErrors,
  }
  console.log(`RESULT ${TAG} ${JSON.stringify(summary)}`)

  // Assertions — identical for baseline and FBM (the only difference is bundledDev):
  // lit has no official HMR => clean full reload. The edited shadow-DOM label must appear AND
  // it must be via a reload (not a silent hot-swap), with no errors.
  if (hmrErrors.length)
    return fail(`browser errors during/after HMR:\n${hmrErrors.join('\n')}`)
  if (!sentinelShown)
    return fail(
      'edited shadow-DOM label never appeared (update was not applied)',
    )
  if (!reloaded)
    return fail(
      'expected a full page reload for lit, but the page state survived (unexpected hot-swap)',
    )

  console.log(`PASS ${TAG}: lit-ts applied the edit via a clean full reload.`)
  await cleanup(0)
}

run().catch((e) => fail(e?.stack || String(e)))

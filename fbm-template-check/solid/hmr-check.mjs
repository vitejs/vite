// Standalone HMR workflow for the create-vite `solid` template under Vite full-bundle mode.
// No Vite test harness: we spawn the app's own `vite` dev server, drive it with Playwright,
// edit src/App.jsx (which renders the <h1> marker + the counter button), and assert the hot update.
//
// solid uses vite-plugin-solid + solid-refresh, which injects SELF-ACCEPTING HMR boundaries at
// TRANSFORM time (like react/preact). The correct outcome is a COMPONENT HOT-SWAP:
//   - the edited <h1> sentinel appears (the module was hot-updated), AND
//   - the page did NOT full-reload (our window.__noReload sentinel survives).
//
// IMPORTANT — state preservation: GOAL.md §1 lists "state preserved" for solid, but that is NOT
// the stock template's actual behavior. solid-refresh 0.6.3's own README (Limitations) states:
// "Preserving state: The default mode does not allow preserving state through module replacement.
//  `@refresh granular` allows this partially." The create-vite solid template does NOT add the
// `@refresh granular` pragma, so the DEFAULT mode runs: the component is replaced and the counter
// signal RESETS to 0 on every edit — EVEN IN NORMAL (non-FBM) DEV. The `--no-fbm` baseline below
// confirms this empirically (statePreserved:false). Per LOOP.md the FBM run must MATCH the
// template's own baseline and must not be WEAKER — it must not be stronger-imaginary either. So
// the load-bearing assertion is "hot-swap + no full reload"; we additionally assert FBM's state
// behavior equals the baseline's (both reset — not a regression), the honest empirical contract.
// We derive the baseline by running `--no-fbm` first; the FBM run must match it (not be weaker).
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
const EDIT = join(__dirname, 'src/App.jsx') // renders the <h1> marker + counter
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
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => pageErrors.push(String(e)))

async function run() {
  await page.goto(url, { waitUntil: 'domcontentloaded' })

  // 1. Initial render: <h1> marker present.
  // Under FBM, the dev server may first serve a "Bundling in progress" fallback page that
  // auto-reloads to the real app once the initial bundle is built. So we poll for the actual
  // starter marker (not just any <h1>) — this is correct for both baseline and FBM and does NOT
  // weaken anything (the real app must still appear; we only tolerate FBM's startup reload).
  try {
    await page.waitForFunction(
      (m) => document.querySelector('h1')?.textContent?.includes(m),
      MARKER,
      { timeout: 30_000 },
    )
  } catch {
    const h1 = await page.evaluate(
      () => document.querySelector('h1')?.textContent ?? '(no h1)',
    )
    return fail(
      `initial render never showed "${MARKER}" within 30s (last h1: ${JSON.stringify(h1)})`,
    )
  }

  // 2. Counter increments — click it to set state count=1
  const counter = page.locator('button.counter')
  await counter.click()
  await page.waitForFunction(
    () =>
      /Count is 1/.test(
        document.querySelector('button.counter')?.textContent ?? '',
      ),
    null,
    { timeout: 5_000 },
  )

  // boot-time console errors (uncaught) are a failure
  const bootErrors = [
    ...pageErrors,
    ...logs.filter((l) => l.startsWith('[error]') && !/favicon/.test(l)),
  ]
  if (bootErrors.length)
    return fail(`uncaught browser errors on boot:\n${bootErrors.join('\n')}`)

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
  writeFileSync(EDIT, before.replace(MARKER, SENTINEL))

  let sentinelShown = false
  try {
    await page.waitForFunction(
      (s) => document.querySelector('h1')?.textContent?.includes(s),
      SENTINEL,
      {
        timeout: 20_000,
      },
    )
    sentinelShown = true
  } catch {
    sentinelShown = false
  } finally {
    writeFileSync(EDIT, before) // restore source no matter what
  }

  // settle: let any [vite] hot-update / page-reload logs flush
  await page.waitForTimeout(500)

  const survived = await page.evaluate(() => window.__noReload === true)
  const reloaded = !survived
  const countText = await page.evaluate(
    () => document.querySelector('button.counter')?.textContent?.trim() ?? '',
  )
  const statePreserved = /Count is 1/.test(countText)
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
    statePreserved,
    sawFullReload,
    sawHotUpdate,
    hmrErrors,
  }
  console.log(`RESULT ${TAG} ${JSON.stringify(summary)}`)

  // Assertions — identical for baseline and FBM (the only difference is bundledDev):
  // solid => component HOT-SWAP via solid-refresh. The new <h1> text must appear via a hot update
  // (NOT a full reload). State preservation is NOT part of the contract: solid-refresh's DEFAULT
  // mode (no `@refresh granular` pragma in the stock template) resets signals on replacement, so
  // the baseline itself shows statePreserved:false. We therefore assert hot-swap + no-reload, and
  // require the FBM state behavior to MATCH the baseline (both reset) — i.e. FBM is not weaker.
  const BASELINE_STATE_PRESERVED = false // empirically established by the `--no-fbm` run (see header)
  if (hmrErrors.length)
    return fail(`browser errors during/after HMR:\n${hmrErrors.join('\n')}`)
  if (!sentinelShown)
    return fail(
      'edited <h1> sentinel never appeared in the DOM (update was not applied)',
    )
  if (reloaded)
    return fail(
      'expected a solid-refresh hot-swap, but the page fully reloaded (window.__noReload lost)',
    )
  if (statePreserved !== BASELINE_STATE_PRESERVED)
    return fail(
      `FBM state behavior diverges from baseline: baseline statePreserved=${BASELINE_STATE_PRESERVED}, ` +
        `this run statePreserved=${statePreserved} (countText: ${JSON.stringify(countText)})`,
    )

  console.log(
    `PASS ${TAG}: solid-refresh hot-swapped App.jsx (no full reload); state behavior matches baseline ` +
      `(statePreserved=${statePreserved}, the solid-refresh default-mode reset).`,
  )
  await cleanup(0)
}

run().catch((e) => fail(e?.stack || String(e)))

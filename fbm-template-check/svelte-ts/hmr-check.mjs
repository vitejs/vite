// Standalone HMR workflow for the create-vite `svelte-ts` template under Vite full-bundle mode (FBM).
// Spawns the app's real vite dev server, drives it with Playwright, edits src/lib/Counter.svelte,
// and asserts the FBM hot update is NOT WEAKER than the `--no-fbm` baseline (same hot-swap,
// no full reload, and state behavior at least as good as the baseline).
//
// NOTE on Svelte 5: its built-in HMR (`svelte/internal/client/dev/hmr.js` `hmr()` wrapper)
// DESTROYS + re-creates the component instance on every update, so local `$state` runes
// (`let count: number = $state(0)`) reset to their initial value. This is the BASELINE behavior
// in plain non-FBM dev too — Svelte 5 dropped svelte-hmr's `preserveLocalState`. Hence the
// driver derives the state expectation from the recorded baseline rather than hard-coding it.
// (svelte-ts is byte-for-byte the same component as `svelte`, only with `lang="ts"`.)
//
// Toggle FBM via `--no-fbm` (baseline, bundledDev off) vs default (bundledDev on).
// NO Vite test harness.
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
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
const EDIT = join(__dirname, 'src/lib/Counter.svelte')
const H1_MARKER = 'Get started' // App.svelte <h1>
const LABEL = 'Count is' // text Counter.svelte renders on the button
const SENTINEL = `HMR-OK-${FBM ? 'fbm' : 'base'}` // becomes "HMR-OK-… is {count}"
const BASELINE_FILE = join(__dirname, '.baseline.json')

const server = spawn('corepack', ['pnpm', 'dev'], {
  cwd: __dirname,
  env: { ...process.env, ...(FBM ? {} : { VITE_NO_FBM: '1' }) },
  stdio: ['ignore', 'pipe', 'pipe'],
})

const url = await new Promise((res, rej) => {
  const t = setTimeout(
    () => rej(new Error('dev server did not print a URL')),
    60_000,
  )
  server.stdout.on('data', (b) => {
    const m = /(http:\/\/localhost:\d+\/?)/.exec(b.toString())
    if (m) {
      clearTimeout(t)
      res(m[1])
    }
  })
  server.stderr.on('data', (b) => process.stderr.write(b))
})

const browser = await chromium.launch()
const page = await browser.newPage()
const logs = []
const hmrErrors = []
page.on('console', (m) => {
  const t = m.text()
  logs.push(t)
  if (m.type() === 'error') hmrErrors.push(t)
})
page.on('pageerror', (e) =>
  hmrErrors.push('pageerror: ' + (e?.message || String(e))),
)

async function cleanup(code) {
  await browser.close().catch(() => {})
  server.kill('SIGTERM')
  process.exit(code)
}
const fail = (msg) => {
  console.error('FAIL:', msg)
  return cleanup(1)
}

async function main() {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForSelector('h1')
  const h1 = (await page.textContent('h1')) || ''
  if (!h1.includes(H1_MARKER))
    return await fail(
      `initial render missing <h1> marker, got: ${JSON.stringify(h1)}`,
    )

  // increment counter -> state becomes 1
  await page.click('button.counter')
  await page.waitForFunction(
    () =>
      document
        .querySelector('button.counter')
        ?.textContent?.includes('Count is 1'),
    null,
    { timeout: 5_000 },
  )

  // reload sentinel
  await page.evaluate(() => (window.__noReload = true))

  // edit the label string Counter.svelte renders -> sentinel
  const before = readFileSync(EDIT, 'utf8')
  if (!before.includes(LABEL))
    throw new Error(`edit target missing label string ${JSON.stringify(LABEL)}`)
  let sentinelShown = false
  try {
    writeFileSync(EDIT, before.replace(LABEL, SENTINEL))
    await page.waitForFunction(
      (s) => document.querySelector('button.counter')?.textContent?.includes(s),
      SENTINEL,
      { timeout: 15_000 },
    )
    sentinelShown = true
  } catch (e) {
    sentinelShown = false
  } finally {
    writeFileSync(EDIT, before) // restore
  }

  const noReloadFlag = await page.evaluate(() => window.__noReload === true)
  const sawFullReload = logs.some((l) =>
    /\[vite\] (?:page reload|hmr update failed|invalidate)/.test(l),
  )
  const sawHotUpdate = logs.some((l) => /hot updated|hmr update/i.test(l))

  // counter text after the edit: read the trailing number
  const counterText = (await page.textContent('button.counter')) || ''
  const m = /(\d+)\s*$/.exec(counterText.trim())
  const stateValue = m ? Number(m[1]) : null
  const statePreserved = stateValue === 1

  const result = {
    fbm: FBM,
    sentinelShown,
    reloaded: !noReloadFlag,
    statePreserved,
    sawFullReload,
    sawHotUpdate,
    counterText,
    hmrErrors,
  }
  console.log(JSON.stringify(result))

  // --- Invariants that hold regardless of baseline (a real hot update, not a full reload) ---
  if (!sentinelShown)
    return await fail('edit did not appear in DOM (no hot update applied)')
  if (!noReloadFlag)
    return await fail(
      'expected hot-swap (no full reload) but the page reloaded',
    )
  if (hmrErrors.length)
    return await fail(
      `HMR produced console/page errors: ${JSON.stringify(hmrErrors)}`,
    )

  if (!FBM) {
    // Baseline run: record what plain Svelte-5 non-FBM dev actually does, for the FBM run to compare against.
    writeFileSync(BASELINE_FILE, JSON.stringify(result, null, 2))
    return await cleanup(0)
  }

  // --- FBM run: must NOT be weaker than the recorded baseline ---
  if (!existsSync(BASELINE_FILE))
    return await fail(
      'no baseline recorded; run `node hmr-check.mjs --no-fbm` first',
    )
  const base = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'))
  // State preservation must be at least as good as the baseline. Svelte 5 baseline resets $state
  // (statePreserved:false); FBM matching that is acceptable. If a future Svelte/baseline DOES
  // preserve state, FBM is required to as well.
  if (base.statePreserved && !statePreserved)
    return await fail(
      `FBM weaker than baseline: baseline preserved counter state but FBM reset it (got ${JSON.stringify(counterText)})`,
    )
  if (base.reloaded === false && result.reloaded === true)
    return await fail(
      'FBM weaker than baseline: baseline hot-swapped but FBM did a full reload',
    )

  await cleanup(0)
}

try {
  await main()
} catch (e) {
  await fail(e?.stack || String(e))
}

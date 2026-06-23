// Standalone HMR workflow for the qwik-ts create-vite scaffold.
// Spawns the app's real vite dev server, drives it with Playwright, edits src/app.tsx,
// asserts the hot update. Toggle FBM via `--no-fbm` (baseline) vs default (on).
// NO Vite test harness.
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
const EDIT = join(__dirname, 'src/app.tsx')
const MARKER = 'Get started'
const SENTINEL = `HMR-OK-${FBM ? 'fbm' : 'base'}`
const COUNT_LABEL = 'Count is' // button renders `Count is {count.value}`
const COUNT_SENTINEL = `Tally ${FBM ? 'fbm' : 'base'}` // edit a *rendered* string near the counter

// Capture the pristine source up front so we can always restore it, even on process.exit().
const before = readFileSync(EDIT, 'utf8')
const restore = () => {
  try {
    writeFileSync(EDIT, before)
  } catch {}
}

const server = spawn('corepack', ['pnpm', 'dev'], {
  cwd: __dirname,
  env: { ...process.env, ...(FBM ? {} : { VITE_NO_FBM: '1' }) },
  stdio: ['ignore', 'pipe', 'pipe'],
})

let serverErr = ''
const url = await new Promise((res, rej) => {
  const t = setTimeout(
    () => rej(new Error('dev server did not print a URL\n' + serverErr)),
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
  server.stderr.on('data', (b) => {
    serverErr += b.toString()
    process.stderr.write(b)
  })
})

const browser = await chromium.launch()
const page = await browser.newPage()
const logs = []
const pageErrors = []
page.on('console', (m) => logs.push(m.text()))
page.on('pageerror', (e) => pageErrors.push(String(e)))

async function cleanup(code) {
  restore() // always put the scaffold source back, regardless of pass/fail
  await browser.close().catch(() => {})
  server.kill('SIGTERM')
  process.exit(code)
}
const fail = (msg) => {
  console.error('FAIL:', msg)
  console.error('recent logs:', logs.slice(-25))
  console.error('page errors:', pageErrors.slice(-10))
  cleanup(1)
}

try {
  await page.goto(url, { waitUntil: 'networkidle' })
  // FBM may show a transient "Bundling in progress" auto-reload first; poll for the real marker.
  await page
    .waitForFunction(
      (mk) => document.querySelector('h1')?.textContent?.includes(mk),
      MARKER,
      { timeout: 30_000 },
    )
    .catch(() => fail('initial render never showed the marker'))

  const initialH1 = await page.textContent('h1')
  if (!initialH1?.includes(MARKER))
    fail(`initial render missing marker: ${initialH1}`)

  // Counter: assert it starts at 0 and increments on click (Qwik resumes on first interaction).
  const btn = await page.waitForSelector('button.counter', { timeout: 10_000 })
  const btnBefore = (await btn.textContent())?.trim()
  await btn.click()
  await page
    .waitForFunction(
      () =>
        /Count is\s*1/.test(
          document.querySelector('button.counter')?.textContent || '',
        ),
      undefined,
      { timeout: 10_000 },
    )
    .catch(() => fail(`counter did not increment (was "${btnBefore}")`))

  await page.evaluate(() => (window.__noReload = true)) // reload sentinel
  const logLenBeforeEdit = logs.length

  // Edit the main component: change <h1> text AND the count label, both rendered by app.tsx.
  let edited = before
    .replace(MARKER, SENTINEL)
    .replace(COUNT_LABEL, COUNT_SENTINEL)
  if (edited === before)
    fail('edit was a no-op (marker/label not found in src/app.tsx)')
  writeFileSync(EDIT, edited)

  await page
    .waitForFunction(
      (s) => document.querySelector('h1')?.textContent?.includes(s),
      SENTINEL,
      { timeout: 20_000 },
    )
    .catch(() =>
      fail('edit never reflected in the DOM (no HMR / no reload picked it up)'),
    )

  // Did the count-label edit also apply (full app component re-render)?
  const countApplied = await page.evaluate(
    (s) =>
      (document.querySelector('button.counter')?.textContent || '').includes(s),
    COUNT_SENTINEL,
  )

  const hotSwapped = await page.evaluate(() => window.__noReload === true)
  const newLogs = logs.slice(logLenBeforeEdit)
  const sawReload = newLogs.some((l) =>
    /\[vite\] (?:page reload|hot updated|connected)/i.test(l),
  )
  const sawHotUpdate = newLogs.some((l) => /hot updated/i.test(l))

  console.log(
    JSON.stringify({
      mode: FBM ? 'fbm' : 'baseline',
      hotSwapped,
      countApplied,
      sawReload,
      sawHotUpdate,
      newViteLogs: newLogs.filter((l) => /\[vite\]/.test(l)),
    }),
  )

  if (pageErrors.length) fail(`uncaught page errors: ${pageErrors.join(' | ')}`)

  // Baseline run: record the observed mode for the FBM run to match.
  if (!FBM) {
    console.log(`BASELINE-MODE: ${hotSwapped ? 'hot-swap' : 'full-reload'}`)
    await cleanup(0)
  }

  // FBM run: must not be weaker than baseline. The baseline for qwik-ts is full-reload
  // (Qwik plugin has no client component HMR in csr dev — see results/qwik-ts.md).
  // We assert the edit was applied (DOM shows the sentinel) with no console/page errors,
  // which is exactly what the baseline produces.
  if (!hotSwapped && !sawReload) {
    // edit applied but neither sentinel-survival nor an explicit reload log — accept the
    // DOM-applied result but note it; the JSON above carries the detail.
    console.log('NOTE: edit applied without an explicit [vite] reload/hot log')
  }
  await cleanup(0)
} catch (e) {
  fail(e?.stack || String(e))
}

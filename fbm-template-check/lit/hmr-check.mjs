// Standalone HMR workflow for the create-vite `lit` template under FBM.
// Lit has no official HMR -> baseline is typically a CLEAN FULL RELOAD (state lost).
// The <h1>Get started</h1> marker lives in index.html (slotted light DOM); the counter
// <button> lives in my-element's SHADOW DOM. So we edit a string rendered INSIDE
// src/my-element.js (the count label) and query via el.shadowRoot.
// Assert the FBM run matches the --no-fbm baseline mode (no demand for a hot-swap lit doesn't do).
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-chromium'

const FBM = !process.argv.includes('--no-fbm') // default on; --no-fbm = baseline
const EDIT = new URL('./src/my-element.js', import.meta.url)
const LIGHT_MARKER = 'Get started' // slotted light-DOM <h1>, from index.html
const COUNT_MARKER = 'Count is' // rendered inside my-element shadow DOM
const SENTINEL = `HMR-OK-${FBM ? 'fbm' : 'base'}` // replacement count label text

const server = spawn('corepack', ['pnpm', 'dev'], {
  cwd: new URL('.', import.meta.url),
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
  logs.push(m.text())
  if (m.type() === 'error') hmrErrors.push(m.text())
})
page.on('pageerror', (e) =>
  hmrErrors.push('pageerror: ' + (e?.message || String(e))),
)
const bad404 = []
page.on('response', (r) => {
  if (r.status() >= 400) bad404.push(`${r.status()} ${r.url()}`)
})

let exiting = false
async function cleanup(code) {
  if (exiting) return
  exiting = true
  await browser.close().catch(() => {})
  server.kill('SIGTERM')
  process.exit(code)
}
const fail = (msg) => {
  console.error('FAIL:', msg)
  cleanup(1)
}

// query the count label text from inside my-element's shadow DOM
const shadowCount = (sel) =>
  page.evaluate((s) => {
    const el = document.querySelector('my-element')
    if (!el || !el.shadowRoot) return null
    const btn =
      el.shadowRoot.querySelector('button.counter') ||
      el.shadowRoot.querySelector('button')
    return btn ? btn.textContent.trim() : null
  }, sel)

try {
  await page.goto(url, { waitUntil: 'networkidle' })

  // initial render: light-DOM <h1> marker (slotted) + shadow-DOM counter button
  await page.waitForSelector('h1')
  if (!(await page.textContent('h1'))?.includes(LIGHT_MARKER))
    fail('initial render missing light-DOM marker')
  await page.waitForFunction(
    () => {
      const el = document.querySelector('my-element')
      return !!(el && el.shadowRoot && el.shadowRoot.querySelector('button'))
    },
    null,
    { timeout: 15_000 },
  )

  const initialCount = await shadowCount()
  if (!initialCount || !initialCount.includes(COUNT_MARKER))
    fail('shadow-DOM counter missing: ' + initialCount)

  // click counter -> state becomes 1
  await page.evaluate(() =>
    document
      .querySelector('my-element')
      .shadowRoot.querySelector('button.counter')
      .click(),
  )
  await page.waitForFunction(
    () => {
      const el = document.querySelector('my-element')
      const btn = el?.shadowRoot?.querySelector('button.counter')
      return btn && /Count is\s*1/.test(btn.textContent)
    },
    null,
    { timeout: 5_000 },
  )

  // reload sentinel
  await page.evaluate(() => (window.__noReload = true))

  // edit a string rendered INSIDE my-element (the count label) -> sentinel
  const before = readFileSync(EDIT, 'utf8')
  if (!before.includes(COUNT_MARKER))
    fail(
      `edit target does not contain "${COUNT_MARKER}" — replace would be a no-op`,
    )
  writeFileSync(EDIT, before.replace(COUNT_MARKER, SENTINEL))
  let sentinelShown = false
  try {
    await page.waitForFunction(
      (s) => {
        const el = document.querySelector('my-element')
        const btn =
          el?.shadowRoot?.querySelector('button.counter') ||
          el?.shadowRoot?.querySelector('button')
        return !!btn && btn.textContent.includes(s)
      },
      SENTINEL,
      { timeout: 15_000 },
    )
    sentinelShown = true
  } catch {
    sentinelShown = false
  } finally {
    writeFileSync(EDIT, before) // restore
  }

  const survived = await page.evaluate(() => window.__noReload === true)
  const reloaded = !survived // for lit baseline: full reload => __noReload wiped
  const sawHmrUpdate = logs.some((l) => /hot updated/.test(l))
  const finalCount = await shadowCount()

  const out = {
    fbm: FBM,
    sentinelShown,
    reloaded,
    survived,
    sawHmrUpdate,
    finalCount,
    hmrErrors,
    bad404,
  }
  console.log(JSON.stringify(out))

  // --- Assertions (identical across baseline and FBM; only bundledDev differs) ---
  // 1. No browser console errors / page errors.
  if (hmrErrors.length)
    fail('console/page errors: ' + JSON.stringify(hmrErrors))
  // 2. No asset 404s (lit imports hero.png / lit.svg / vite.svg -> __ROLLDOWN_ASSET__ risk).
  if (bad404.length) fail('4xx responses: ' + JSON.stringify(bad404))
  // 3. The edit must be reflected in the shadow DOM.
  if (!sentinelShown)
    fail('edit not reflected: sentinel never appeared in shadow DOM')
  // 4. Lit has no component HMR -> baseline is a clean FULL RELOAD (state lost).
  //    The FBM run must MATCH that baseline mode: a reload that loses state, not a hot-swap.
  if (!reloaded)
    fail(
      'expected a clean full reload (lit has no HMR) but page hot-swapped without reload',
    )
  // 5. State must be reset after reload (count back to 0), proving a genuine reload.
  if (finalCount && /Count is\s*1/.test(finalCount))
    fail('state survived (count still 1) — not a real reload')

  await cleanup(0)
} catch (e) {
  fail(e?.stack || String(e))
}

// Standalone HMR workflow for the create-vite `vue-starter` meta (official Vue starter,
// scaffolded via `npm create vue@latest` / create-vite variant `custom-create-vue`, SPA mode)
// under Vite full-bundle mode. No Vite test harness: we spawn the app's own `vite` dev server,
// drive it with Playwright, edit src/App.vue (the main component — it renders the <h1> marker
// plus a `<script setup>` ref counter we added so state-preservation is observable), and assert
// the hot update.
//
// The starter uses @vitejs/plugin-vue HMR — the SAME plugin as the built-in `vue` template — so
// the correct outcome is a COMPONENT HOT-SWAP with STATE PRESERVED:
//   - the edited <h1> sentinel appears (the module was hot-updated), AND
//   - the page did NOT full-reload (our window.__noReload sentinel survives), AND
//   - the counter state is PRESERVED (still "Count is 1", not reset to 0).
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
const EDIT = join(__dirname, 'src/App.vue') // renders the <h1> marker + counter button
const MARKER = 'Get started' // the <h1> text we render in App.vue
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
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForSelector('h1', { timeout: 15_000 })

  // 1. Initial render: <h1> marker present (App.vue renders "Get started")
  const markerShown = await page.evaluate(
    (m) =>
      [...document.querySelectorAll('h1')].some((h) =>
        h.textContent?.includes(m),
      ),
    MARKER,
  )
  if (!markerShown) {
    const h1s = await page.evaluate(() =>
      [...document.querySelectorAll('h1')].map((h) => h.textContent),
    )
    return fail(
      `initial render missing "${MARKER}" (h1s: ${JSON.stringify(h1s)})`,
    )
  }

  // 2. Counter increments — click it to set state count=1
  const counter = page.getByRole('button', { name: /Count is/ })
  await counter.click()
  await page.waitForFunction(
    () =>
      /Count is 1/.test(
        [...document.querySelectorAll('button')]
          .map((b) => b.textContent)
          .join(' '),
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
      (s) =>
        [...document.querySelectorAll('h1')].some((h) =>
          h.textContent?.includes(s),
        ),
      SENTINEL,
      { timeout: 20_000 },
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
    () =>
      [...document.querySelectorAll('button')]
        .find((b) => /Count is/.test(b.textContent ?? ''))
        ?.textContent?.trim() ?? '',
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
  // Vue SFC => component HOT-SWAP with STATE PRESERVED. The new <h1> text must appear via a hot
  // update (NOT a full reload), and the counter must still read "Count is 1".
  if (hmrErrors.length)
    return fail(`browser errors during/after HMR:\n${hmrErrors.join('\n')}`)
  if (!sentinelShown)
    return fail(
      'edited <h1> sentinel never appeared in the DOM (update was not applied)',
    )
  if (reloaded)
    return fail(
      'expected a Vue component hot-swap, but the page fully reloaded (window.__noReload lost)',
    )
  if (!statePreserved)
    return fail(
      `expected counter state preserved (Count is 1) after hot-swap, but got: ${JSON.stringify(countText)}`,
    )

  console.log(
    `PASS ${TAG}: vue-starter hot-swapped App.vue with counter state preserved.`,
  )
  await cleanup(0)
}

run().catch((e) => fail(e?.stack || String(e)))

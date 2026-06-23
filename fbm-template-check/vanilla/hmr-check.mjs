// Standalone HMR workflow for the create-vite `vanilla` template under Vite full-bundle mode.
// No Vite test harness: we spawn the app's own `vite` dev server, drive it with Playwright,
// edit src/main.js (which renders the <h1> marker into #app), and assert the hot update.
//
// vanilla has no component runtime HMR, so the correct outcome is a CLEAN FULL RELOAD:
//   - the edited <h1> sentinel appears (the dev server served the new module), AND
//   - the page actually reloaded (our window.__noReload sentinel is gone), i.e. NOT a hot-swap.
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
const EDIT = join(__dirname, 'src/main.js') // renders `<h1>Get started</h1>` into #app
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
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForSelector('h1', { timeout: 15_000 })

  // 1. Initial render: <h1> marker present
  const h1 = await page.textContent('h1')
  if (!h1?.includes(MARKER))
    return fail(
      `initial render missing "${MARKER}" (got: ${JSON.stringify(h1)})`,
    )

  // 2. Counter increments
  const counter = page.locator('#counter')
  await counter.click()
  await page.waitForFunction(
    () =>
      /Count is 1/.test(document.querySelector('#counter')?.textContent ?? ''),
    null,
    {
      timeout: 5_000,
    },
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
  // vanilla => clean full reload. The new <h1> text must appear AND it must be via a reload
  // (no component hot-swap), with no errors.
  if (hmrErrors.length)
    return fail(`browser errors during/after HMR:\n${hmrErrors.join('\n')}`)
  if (!sentinelShown)
    return fail(
      'edited <h1> sentinel never appeared in the DOM (update was not applied)',
    )
  if (!reloaded)
    return fail(
      'expected a full page reload for vanilla, but the page state survived (unexpected hot-swap)',
    )

  console.log(`PASS ${TAG}: vanilla applied the edit via a clean full reload.`)
  await cleanup(0)
}

run().catch((e) => fail(e?.stack || String(e)))

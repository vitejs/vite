// Standalone HMR workflow for the create-vite `vanilla-ts` template under Vite full-bundle mode.
// No Vite test harness: we spawn the app's own `vite` dev server, drive it with Playwright,
// edit src/main.ts (which renders the <h1> marker into #app), and assert the hot update.
//
// vanilla-ts has no component runtime HMR, so the correct outcome is a CLEAN FULL RELOAD:
//   - the edited <h1> sentinel appears (the dev server served the new module), AND
//   - the page actually reloaded (our window.__noReload sentinel is gone), i.e. NOT a hot-swap.
// We derive the baseline by running `--no-fbm` first; the FBM run must match it (not be weaker).
//
// vanilla-ts imports assets (hero.png / typescript.svg / vite.svg) so we also verify the hero
// <img> resolves to a real hashed URL under FBM (the __ROLLDOWN_ASSET__#<refId> risk, vitejs/vite#22596).
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
const EDIT = join(__dirname, 'src/main.ts') // renders `<h1>Get started</h1>` into #app
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
const bad4xx = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => pageErrors.push(String(e)))
page.on('response', (r) => {
  if (r.status() >= 400 && !/favicon/.test(r.url()))
    bad4xx.push(`${r.status()} ${r.url()}`)
})

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

  // 3. Asset resolution: the hero <img> must resolve to a real (loaded) URL, not an
  //    unresolved __ROLLDOWN_ASSET__#<refId> placeholder (vitejs/vite#22596).
  const hero = await page.evaluate(() => {
    const img = document.querySelector('.hero img.base')
    return img
      ? { src: img.getAttribute('src'), naturalWidth: img.naturalWidth }
      : null
  })
  if (!hero) return fail('hero <img> not found')
  if (/__ROLLDOWN_ASSET__/.test(hero.src ?? ''))
    return fail(`hero src is an unresolved placeholder: ${hero.src}`)
  if (!(hero.naturalWidth > 0))
    return fail(
      `hero image did not load (naturalWidth=${hero.naturalWidth}, src=${hero.src})`,
    )

  // boot-time console errors (uncaught) are a failure
  const bootErrors = [
    ...pageErrors,
    ...logs.filter((l) => l.startsWith('[error]') && !/favicon/.test(l)),
  ]
  if (bootErrors.length)
    return fail(`uncaught browser errors on boot:\n${bootErrors.join('\n')}`)
  if (bad4xx.length) return fail(`4xx responses on boot:\n${bad4xx.join('\n')}`)

  // 4. Install reload sentinel, then edit the source
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
    heroSrc: hero.src,
    hmrErrors,
  }
  console.log(`RESULT ${TAG} ${JSON.stringify(summary)}`)

  // Assertions — identical for baseline and FBM (the only difference is bundledDev):
  // vanilla-ts => clean full reload. The new <h1> text must appear AND it must be via a reload
  // (no component hot-swap), with no errors and assets resolved.
  if (hmrErrors.length)
    return fail(`browser errors during/after HMR:\n${hmrErrors.join('\n')}`)
  if (!sentinelShown)
    return fail(
      'edited <h1> sentinel never appeared in the DOM (update was not applied)',
    )
  if (!reloaded)
    return fail(
      'expected a full page reload for vanilla-ts, but the page state survived (unexpected hot-swap)',
    )

  console.log(
    `PASS ${TAG}: vanilla-ts applied the edit via a clean full reload.`,
  )
  await cleanup(0)
}

run().catch((e) => fail(e?.stack || String(e)))

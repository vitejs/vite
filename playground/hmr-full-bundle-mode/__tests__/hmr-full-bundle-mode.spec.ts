import { setTimeout } from 'node:timers/promises'
import { expect, test, onTestFinished } from 'vitest'
import {
  addFile,
  browserLogs,
  editFile,
  isBuild,
  page,
  readFile,
  serverLogs,
} from '~utils'

const assetUrl = /asset-[\w-]+\.png/

if (isBuild) {
  test('should render', async () => {
    expect(await page.textContent('h1')).toContain('HMR Full Bundle Mode')
    await expect.poll(() => page.textContent('.app')).toBe('hello')
    await expect.poll(() => page.textContent('.hmr')).toBe('hello')
  })
} else {
  // INITIAL -> BUNDLING -> BUNDLED
  test('show bundling in progress', async () => {
    const reloadPromise = page.waitForEvent('load')
    await expect
      .poll(() => page.textContent('body'))
      .toContain('Bundling in progress')
    await reloadPromise // page shown after reload
    await expect.poll(() => page.textContent('h1')).toBe('HMR Full Bundle Mode')
    await expect.poll(() => page.textContent('.app')).toBe('hello')
    await expect.poll(() => page.textContent('.asset')).toMatch(assetUrl)
    await expect
      .poll(() => page.textContent('.worker-query'))
      .toBe('worker-query')
    await expect.poll(() => page.textContent('.worker-url')).toBe('worker-url')
  })

  // BUNDLED -> GENERATE_HMR_PATCH -> BUNDLING -> BUNDLE_ERROR -> BUNDLING -> BUNDLED
  test('handle bundle error', async () => {
    editFile('main.js', (code) =>
      code.replace("text('.app', 'hello')", "text('.app', 'hello'); text("),
    )
    await expect.poll(() => page.isVisible('vite-error-overlay')).toBe(true)
    editFile('main.js', (code) =>
      code.replace("text('.app', 'hello'); text(", "text('.app', 'hello')"),
    )
    await expect.poll(() => page.isVisible('vite-error-overlay')).toBe(false)
    await expect.poll(() => page.textContent('.app')).toBe('hello')
  })

  // BUNDLED -> GENERATE_HMR_PATCH -> BUNDLING -> BUNDLED
  test('update bundle', async () => {
    editFile('main.js', (code) =>
      code.replace("text('.app', 'hello')", "text('.app', 'hello1')"),
    )
    await expect.poll(() => page.textContent('.app')).toBe('hello1')

    editFile('main.js', (code) =>
      code.replace("text('.app', 'hello1')", "text('.app', 'hello')"),
    )
    await expect.poll(() => page.textContent('.app')).toBe('hello')
    await expect.poll(() => page.textContent('.asset')).toMatch(assetUrl)
  })

  // BUNDLED -> GENERATE_HMR_PATCH -> BUNDLING -> BUNDLING -> BUNDLED
  test('debounce bundle', async () => {
    editFile('main.js', (code) =>
      code.replace(
        "text('.app', 'hello')",
        "text('.app', 'hello1')\n" + '// @delay-transform',
      ),
    )
    await setTimeout(100)
    editFile('main.js', (code) =>
      code.replace("text('.app', 'hello1')", "text('.app', 'hello2') "),
    )
    await expect.poll(() => page.textContent('.app')).toBe('hello2')

    editFile('main.js', (code) =>
      code.replace(
        "text('.app', 'hello2') \n" + '// @delay-transform',
        "text('.app', 'hello')",
      ),
    )
    await expect.poll(() => page.textContent('.app')).toBe('hello')
  })

  // BUNDLED -> GENERATING_HMR_PATCH -> BUNDLED
  test('handle generate hmr patch error', async () => {
    await expect.poll(() => page.textContent('.hmr')).toBe('hello')
    const lastServerLogIndex = serverLogs.length
    editFile('hmr.js', (code) =>
      code.replace("const foo = 'hello'", "const foo = 'hello"),
    )
    await expect.poll(() => page.isVisible('vite-error-overlay')).toBe(true)
    await expect
      .poll(() => serverLogs.slice(lastServerLogIndex).join('\n'))
      .toContain('Build error')

    editFile('hmr.js', (code) =>
      code.replace("const foo = 'hello", "const foo = 'hello'"),
    )
    await expect.poll(() => page.isVisible('vite-error-overlay')).toBe(false)
    await expect.poll(() => page.textContent('.hmr')).toContain('hello')
  })

  // BUNDLED -> GENERATING_HMR_PATCH -> BUNDLED
  test('generate hmr patch', async () => {
    await expect.poll(() => page.textContent('.hmr')).toBe('hello')
    const hmrPatchFileRes = page.waitForResponse(/\/hmr_patch_\d\.js$/)
    editFile('hmr.js', (code) =>
      code.replace("const foo = 'hello'", "const foo = 'hello1'"),
    )
    try {
      await expect.poll(() => page.textContent('.hmr')).toBe('hello1')

      // ensure that the generated hmr patch contains ESM syntax
      // so that it's not possible to load it in a <script> tag without type="module"
      // which would allow cross origin reads
      expect(await (await hmrPatchFileRes).text()).toMatch(/export\s*\{\}/)
    } finally {
      editFile('hmr.js', (code) =>
        code.replace("const foo = 'hello1'", "const foo = 'hello'"),
      )
    }
    await expect.poll(() => page.textContent('.hmr')).toContain('hello')
    await expect.poll(() => page.textContent('.asset')).toMatch(assetUrl)
  })

  // BUNDLED -> GENERATING_HMR_PATCH -> GENERATING_HMR_PATCH -> BUNDLED
  test('continuous generate hmr patch', async () => {
    editFile('hmr.js', (code) =>
      code.replace(
        "const foo = 'hello'",
        "const foo = 'hello1'\n" + '// @delay-transform',
      ),
    )
    await setTimeout(100)
    editFile('hmr.js', (code) =>
      code.replace("const foo = 'hello1'", "const foo = 'hello2' "),
    )
    await expect.poll(() => page.textContent('.hmr')).toBe('hello2')

    editFile('hmr.js', (code) =>
      code.replace(
        "const foo = 'hello2' \n" + '// @delay-transform',
        "const foo = 'hello'",
      ),
    )
    await expect.poll(() => page.textContent('.hmr')).toBe('hello')
  })

  // an asset added by an HMR patch is emitted without `onOutput`, so it must be
  // served via `onAdditionalAssets`. https://github.com/vitejs/vite/issues/22596
  test('hmr patch serves a newly emitted asset', async () => {
    const original = readFile('hmr-asset.js')
    await expect
      .poll(() => page.getAttribute('#hmr-asset-image', 'alt'))
      .toBe('hmr-asset')

    const assetResponse = page.waitForResponse(/hmr-asset-[\w-]+\.png/)
    editFile(
      'hmr-asset.js',
      (code) =>
        `import imageUrl from './hmr-asset.png'\n` +
        code.replace('/* @asset-src */', 'img.src = imageUrl'),
    )
    onTestFinished(() => {
      addFile('hmr-asset.js', original)
    })

    // the image only decodes if the emitted asset was served (not a 404)
    await expect
      .poll(() =>
        page
          .$eval(
            '#hmr-asset-image',
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          )
          .catch(() => false),
      )
      .toBe(true)
    const src = await page.getAttribute('#hmr-asset-image', 'src')
    expect(src).toMatch(/\/assets\/hmr-asset-[\w-]+\.png/)
    expect((await assetResponse).status()).toBe(200)
  })

  test('worker with ?worker query', async () => {
    await expect
      .poll(() => page.textContent('.worker-query'))
      .toBe('worker-query')
    editFile('worker-query.js', (code) =>
      code.replace(
        "const msg = 'worker-query'",
        "const msg = 'worker-query-updated'",
      ),
    )
    await expect
      .poll(() => page.textContent('.worker-query'))
      .toBe('worker-query-updated')

    editFile('worker-query.js', (code) =>
      code.replace(
        "const msg = 'worker-query-updated'",
        "const msg = 'worker-query'",
      ),
    )
    await expect
      .poll(() => page.textContent('.worker-query'))
      .toBe('worker-query')
  })

  test('worker with new URL', async () => {
    await expect.poll(() => page.textContent('.worker-url')).toBe('worker-url')
    editFile('worker-url.js', (code) =>
      code.replace(
        "const msg = 'worker-url'",
        "const msg = 'worker-url-updated'",
      ),
    )
    await expect
      .poll(() => page.textContent('.worker-url'))
      .toBe('worker-url-updated')

    editFile('worker-url.js', (code) =>
      code.replace(
        "const msg = 'worker-url-updated'",
        "const msg = 'worker-url'",
      ),
    )
    await expect.poll(() => page.textContent('.worker-url')).toBe('worker-url')
  })

  test('lazy bundling', async () => {
    await page.click('#load-dynamic')
    await expect.poll(() => page.textContent('.dynamic')).toBe('loaded')
  })

  // placed before `invalidate` on purpose: that test's cleanup restores
  // invalidation-child.js, whose `hot.invalidate()` propagates to a parent
  // without a shipped factory and forces a full page reload — which would
  // wipe the `hot.data` this test relies on.
  test('preserves import.meta.hot.data across updates', async () => {
    await expect.poll(() => page.textContent('.data-count')).toBe('1')
    await expect.poll(() => page.textContent('.data-disposed')).toBe('0')

    editFile('data.js', (code) =>
      code.replace("data.rev = 'bump0'", "data.rev = 'bump01'"),
    )
    await expect.poll(() => page.textContent('.data-count')).toBe('2')
    await expect.poll(() => page.textContent('.data-disposed')).toBe('1')

    editFile('data.js', (code) =>
      code.replace("data.rev = 'bump01'", "data.rev = 'bump012'"),
    )
    await expect.poll(() => page.textContent('.data-count')).toBe('3')
    await expect.poll(() => page.textContent('.data-disposed')).toBe('2')
  })

  test('invalidate', async () => {
    const original = readFile('invalidation-child.js')
    onTestFinished(() => addFile('invalidation-child.js', original))

    await expect
      .poll(() => page.textContent('.invalidation-parent'))
      .toBe('child')
    const logIndex = browserLogs.length
    editFile('invalidation-child.js', (code) =>
      code.replace("'child'", "'child updated'"),
    )
    // `hot.invalidate()` is handled fully client-side; the update propagates
    // to the parent (re-run in place, or a full reload when the parent's
    // factory was never shipped)
    await expect
      .poll(() => page.textContent('.invalidation-parent'))
      .toBe('child updated')
    expect(
      browserLogs
        .slice(logIndex)
        .some(
          (l) => l.includes('invalidate') && l.includes('invalidation-child'),
        ),
    ).toBe(true)
  })

  test('never-executed accept falls back to a full reload', async () => {
    await expect
      .poll(() => page.textContent('.invalidation-parent'))
      .toBe('child')

    const original = readFile('dead-accept.js')
    onTestFinished(async () => {
      addFile('dead-accept.js', original)
      await expect
        .poll(() => page.textContent('.dead-accept'))
        .toBe('dead-accept')
    })

    await expect
      .poll(() => page.textContent('.dead-accept'))
      .toBe('dead-accept')
    editFile('dead-accept.js', (code) =>
      code.replace("'dead-accept'", "'dead-accept-updated'"),
    )
    await expect
      .poll(() => page.textContent('.dead-accept'))
      .toBe('dead-accept-updated')
  })

  test('editing a worker-only module without accept reloads the page', async () => {
    const original = readFile('worker-plain-dep.js')
    onTestFinished(async () => {
      // the restore edit itself makes the page client reload; a manual
      // `page.reload()` here would race the rebuild and lose the update
      addFile('worker-plain-dep.js', original)
      await expect
        .poll(() => page.textContent('.worker-plain'))
        .toBe('worker-plain')
    })

    await expect
      .poll(() => page.textContent('.worker-plain'))
      .toBe('worker-plain')
    editFile('worker-plain-dep.js', (code) =>
      code.replace("'worker-plain'", "'worker-plain-updated'"),
    )
    await expect
      .poll(() => page.textContent('.worker-plain'))
      .toBe('worker-plain-updated')
  })

  // Blocked by https://github.com/rolldown/rolldown/issues/10340
  test.skip('chained invalidate in an import cycle settles', async () => {
    const original = readFile('cycle-a.js')
    onTestFinished(async () => {
      addFile('cycle-a.js', original)
      await page.reload()
      await expect.poll(() => page.textContent('.cycle')).toBe('cycle')
    })

    const invalidateCount = () =>
      browserLogs.filter(
        (l) => l.includes('invalidate') && l.includes('cycle-b'),
      ).length

    await expect.poll(() => page.textContent('.cycle')).toBe('cycle')
    editFile('cycle-a.js', (code) => code.replace("'cycle'", "'cycle-updated'"))
    await expect.poll(() => page.textContent('.cycle')).toBe('cycle-updated')

    // the invalidate count must stop growing once the update settles
    await setTimeout(1000)
    const settled = invalidateCount()
    await setTimeout(1000)
    expect(invalidateCount()).toBe(settled)
    expect(settled).toBeLessThanOrEqual(2)
  })
}

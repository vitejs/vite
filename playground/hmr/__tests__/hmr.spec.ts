import { stripVTControlCharacters } from 'node:util'
import type { Page } from 'playwright-chromium'
import { beforeAll, describe, expect, it, test } from 'vitest'
import {
  addFile,
  browser,
  browserLogs,
  bundledDevTodo,
  bundledDevUnsupported,
  editFile,
  getBg,
  getColor,
  gotoLatestBuild,
  hotUpdatedLog,
  isBuild,
  isBundledDev,
  page,
  readFile,
  removeFile,
  serverLogs,
  untilBrowserLogAfter,
  viteTestUrl,
} from '~utils'

test('should render', async () => {
  await expect.poll(() => page.textContent('.app')).toBe('1')
  await expect.poll(() => page.textContent('.dep')).toBe('1')
  await expect.poll(() => page.textContent('.nested')).toBe('1')
})

if (!isBuild) {
  test('should connect', async () => {
    if (isBundledDev) {
      // bundled-dev logs extra `connecting...` and `connected` message (5 + 2)
      // if the first bundle is not ready and a fallback page is shown when the client connects.
      expect(browserLogs.length).toBeOneOf([5, 7])
    } else {
      expect(browserLogs.length).toBe(5)
    }
    expect(browserLogs.some((msg) => msg.includes('connected'))).toBe(true)
    browserLogs.length = 0
  })

  const fetchHotEvents = async (): Promise<{
    connectCount: number
    disconnectCount: number
  }> => {
    const res = await fetch(viteTestUrl + '/hot-events-counts')
    return res.json()
  }
  test('hot events', async () => {
    if (isBundledDev) {
      expect(await fetchHotEvents()).toBeOneOf([
        { connectCount: 1, disconnectCount: 0 },
        { connectCount: 2, disconnectCount: 1 }, // landed on fallback page first, then reconnected to main page
      ])
    } else {
      expect(await fetchHotEvents()).toStrictEqual({
        connectCount: 1,
        disconnectCount: 0,
      })
    }
    await untilBrowserLogAfter(() => page.reload(), [/connected/])

    if (isBundledDev) {
      expect(await fetchHotEvents()).toBeOneOf([
        { connectCount: 2, disconnectCount: 1 },
        { connectCount: 3, disconnectCount: 2 },
      ])
    } else {
      expect(await fetchHotEvents()).toStrictEqual({
        connectCount: 2,
        disconnectCount: 1,
      })
    }
  })

  test('self accept', async () => {
    const el = page.locator('.app')
    await untilBrowserLogAfter(
      () =>
        editFile('hmr.ts', (code) =>
          code.replace('const foo = 1', 'const foo = 2 '),
        ),
      [
        '>>> vite:beforeUpdate -- update',
        'foo was: 1',
        '(self-accepting 1) foo is now: 2',
        '(self-accepting 2) foo is now: 2',
        // bundled dev: the client logs rolldown module ids (cwd-relative, like
        // `playground-temp/hmr/hmr.ts`). The same `cwd` issue as in hot update log in #23028.
        isBundledDev
          ? '[vite] hot updated: playground-temp/hmr/hmr.ts'
          : '[vite] hot updated: /hmr.ts',
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await expect.poll(() => el.textContent()).toMatch('2')

    await untilBrowserLogAfter(
      () =>
        editFile('hmr.ts', (code) =>
          code.replace('const foo = 2', 'const foo = 3 '),
        ),
      [
        '>>> vite:beforeUpdate -- update',
        'foo was: 2',
        '(self-accepting 1) foo is now: 3',
        '(self-accepting 2) foo is now: 3',
        isBundledDev
          ? '[vite] hot updated: playground-temp/hmr/hmr.ts'
          : '[vite] hot updated: /hmr.ts',
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await expect.poll(() => el.textContent()).toMatch('3')
  })

  test('hot data persists across module instances', async () => {
    await untilBrowserLogAfter(
      () =>
        editFile('hotData.js', (code) =>
          code.replace('const value = 1', 'const value = 2 '),
        ),
      [
        '>>> vite:beforeUpdate -- update',
        '(hot data) value from execution: 1',
        '(hot data) value from dispose: 1',
        isBundledDev
          ? '[vite] hot updated: playground-temp/hmr/hotData.js'
          : '[vite] hot updated: /hotData.js',
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )

    await untilBrowserLogAfter(
      () =>
        editFile('hotData.js', (code) =>
          code.replace('const value = 2', 'const value = 3  '),
        ),
      [
        '>>> vite:beforeUpdate -- update',
        '(hot data) value from execution: 2',
        '(hot data) value from dispose: 2',
        isBundledDev
          ? '[vite] hot updated: playground-temp/hmr/hotData.js'
          : '[vite] hot updated: /hotData.js',
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
  })

  test('accept dep', async () => {
    const el = page.locator('.dep')
    await untilBrowserLogAfter(
      () =>
        editFile('hmrDep.js', (code) =>
          code.replace('const foo = 1', 'const foo = 2 '),
        ),
      [
        '>>> vite:beforeUpdate -- update',
        '(dep) foo was: 1',
        '(dep) foo from dispose: 1',
        '(single dep) foo is now: 2',
        '(single dep) nested foo is now: 1',
        '(multi deps) foo is now: 2',
        '(multi deps) nested foo is now: 1',
        isBundledDev
          ? '[vite] hot updated: playground-temp/hmr/hmrDep.js via playground-temp/hmr/hmr.ts'
          : '[vite] hot updated: /hmrDep.js via /hmr.ts',
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await expect.poll(() => el.textContent()).toMatch('2')

    await untilBrowserLogAfter(
      () =>
        editFile('hmrDep.js', (code) =>
          code.replace('const foo = 2', 'const foo = 3 '),
        ),
      [
        '>>> vite:beforeUpdate -- update',
        '(dep) foo was: 2',
        '(dep) foo from dispose: 2',
        '(single dep) foo is now: 3',
        '(single dep) nested foo is now: 1',
        '(multi deps) foo is now: 3',
        '(multi deps) nested foo is now: 1',
        isBundledDev
          ? '[vite] hot updated: playground-temp/hmr/hmrDep.js via playground-temp/hmr/hmr.ts'
          : '[vite] hot updated: /hmrDep.js via /hmr.ts',
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await expect.poll(() => el.textContent()).toMatch('3')
  })

  test('nested dep propagation', async () => {
    const el = page.locator('.nested')
    await untilBrowserLogAfter(
      () =>
        editFile('hmrNestedDep.js', (code) =>
          code.replace('const foo = 1', 'const foo = 2 '),
        ),
      [
        '>>> vite:beforeUpdate -- update',
        '(dep) foo was: 3',
        '(dep) foo from dispose: 3',
        '(single dep) foo is now: 3',
        '(single dep) nested foo is now: 2',
        '(multi deps) foo is now: 3',
        '(multi deps) nested foo is now: 2',
        isBundledDev
          ? '[vite] hot updated: playground-temp/hmr/hmrDep.js via playground-temp/hmr/hmr.ts'
          : '[vite] hot updated: /hmrDep.js via /hmr.ts',
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await expect.poll(() => el.textContent()).toMatch('2')

    await untilBrowserLogAfter(
      () =>
        editFile('hmrNestedDep.js', (code) =>
          code.replace('const foo = 2', 'const foo = 3 '),
        ),
      [
        '>>> vite:beforeUpdate -- update',
        '(dep) foo was: 3',
        '(dep) foo from dispose: 3',
        '(single dep) foo is now: 3',
        '(single dep) nested foo is now: 3',
        '(multi deps) foo is now: 3',
        '(multi deps) nested foo is now: 3',
        isBundledDev
          ? '[vite] hot updated: playground-temp/hmr/hmrDep.js via playground-temp/hmr/hmr.ts'
          : '[vite] hot updated: /hmrDep.js via /hmr.ts',
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await expect.poll(() => el.textContent()).toMatch('3')
  })

  const invalidateTodo = bundledDevTodo(
    "`import.meta.hot.invalidate()` cannot hot-update the importer: the HMR patch does not include the importer's factory (`no factory for module`), so the client does a full page reload; a fix could be, e.g., that the client pulls the missing factories from the server",
  )

  test('invalidate', invalidateTodo, async () => {
    const el = page.locator('.invalidation-parent')
    await untilBrowserLogAfter(
      () =>
        editFile('invalidation/child.js', (code) =>
          code.replace('child', 'child updated'),
        ),
      [
        '>>> vite:beforeUpdate -- update',
        '>>> vite:invalidate -- /invalidation/child.js',
        '[vite] invalidate /invalidation/child.js',
        '[vite] hot updated: /invalidation/child.js',
        '>>> vite:afterUpdate -- update',
        '>>> vite:beforeUpdate -- update',
        '(invalidation) parent is executing',
        '[vite] hot updated: /invalidation/parent.js',
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await expect.poll(() => el.textContent()).toMatch('child updated')
  })

  test('invalidate works with multiple tabs', invalidateTodo, async () => {
    let page2: Page
    try {
      page2 = await browser.newPage()
      await page2.goto(viteTestUrl)

      const el = page.locator('.invalidation-parent')
      await untilBrowserLogAfter(
        () =>
          editFile('invalidation/child.js', (code) =>
            code.replace('child', 'child updated'),
          ),
        [
          '>>> vite:beforeUpdate -- update',
          '>>> vite:invalidate -- /invalidation/child.js',
          '[vite] invalidate /invalidation/child.js',
          '[vite] hot updated: /invalidation/child.js',
          '>>> vite:afterUpdate -- update',
          // if invalidate dedupe doesn't work correctly, this beforeUpdate will be called twice
          '>>> vite:beforeUpdate -- update',
          '(invalidation) parent is executing',
          '[vite] hot updated: /invalidation/parent.js',
          '>>> vite:afterUpdate -- update',
        ],
        true,
      )
      await expect.poll(() => el.textContent()).toMatch('child updated')
    } finally {
      await page2.close()
    }
  })

  test(
    'invalidate virtual module propagates to importers',
    invalidateTodo,
    async () => {
      const el = await page.$('.virtual-invalidation-parent')
      await expect.poll(() => el.textContent()).toBe('initial')

      // Edit the real dep file — Vite detects the change and sends
      // js-update to the virtual module.  The virtual module accepts
      // then invalidates, which should propagate to parent.js.
      editFile('virtual-invalidation/dep.js', (code) =>
        code.replace('initial', 'updated2'),
      )

      await expect.poll(() => el.textContent()).toBe('updated2')
    },
  )

  test('invalidate on root triggers page reload', async () => {
    editFile('invalidation/root.js', (code) => code.replace('Init', 'Updated'))
    await page.waitForEvent('load')
    await expect
      .poll(() => page.textContent('.invalidation-root'))
      .toMatch('Updated')
  })

  test('soft invalidate', async () => {
    const el = page.locator('.soft-invalidation')
    await expect
      .poll(() => el.textContent())
      .toBe('soft-invalidation/index.js is transformed 1 times. child is bar')
    editFile('soft-invalidation/child.js', (code) =>
      code.replace('bar', 'updated'),
    )
    await expect
      .poll(() => el.textContent())
      .toBe(
        'soft-invalidation/index.js is transformed 1 times. child is updated',
      )

    editFile('soft-invalidation/index.js', (code) =>
      code.replace('child is', 'child is now'),
    )
    editFile('soft-invalidation/child.js', (code) =>
      code.replace('updated', 'updated?'),
    )
    await expect
      .poll(() => el.textContent())
      .toBe(
        'soft-invalidation/index.js is transformed 2 times. child is now updated?',
      )
  })

  test('invalidate in circular dep should not trigger infinite HMR', async () => {
    const el = page.locator('.invalidation-circular-deps')
    await expect.poll(() => el.textContent()).toMatch('child')
    editFile(
      'invalidation-circular-deps/circular-invalidate/child.js',
      (code) => code.replace('child', 'child updated'),
    )
    await page.waitForEvent('load')
    await expect
      .poll(() => page.textContent('.invalidation-circular-deps'))
      .toMatch('child updated')
  })

  test('invalidate in circular dep should be hot updated if possible', async () => {
    const el = page.locator('.invalidation-circular-deps-handled')
    await expect.poll(() => el.textContent()).toMatch('child')
    editFile(
      'invalidation-circular-deps/invalidate-handled-in-circle/child.js',
      (code) => code.replace('child', 'child updated'),
    )
    await expect.poll(() => el.textContent()).toMatch('child updated')
  })

  const hotUpdateTodo = bundledDevTodo(
    "A Vite plugin's `hotUpdate` hook does not run on a file change: Rolldown supports the `hotUpdate` hook only for Rust plugins, and the hook stays off (`experimental.devMode.hotUpdate`) until its JS-side adapter lands",
    { vite: [22956], rolldown: [10065] },
  )

  test('plugin hmr handler + custom event', hotUpdateTodo, async () => {
    const el = page.locator('.custom')
    editFile('customFile.js', (code) => code.replace('custom', 'edited2'))
    await expect.poll(() => el.textContent()).toMatch('edited2')
  })

  test('plugin hmr remove custom events', hotUpdateTodo, async () => {
    const el = page.locator('.toRemove')
    await expect.poll(() => el.textContent()).toMatch('edited2')
    editFile('customFile.js', (code) => code.replace('edited2', 'custom33'))
    await expect.poll(() => el.textContent()).toMatch('edited2')
  })

  test('plugin client-server communication', async () => {
    const el = page.locator('.custom-communication')
    await expect.poll(() => el.textContent()).toMatch('3')
  })

  const htmlEditTodo = bundledDevTodo(
    'Editing the markup of an HTML entry (anything that stays in the HTML output, not an inline `<script type="module">`) does not reload the page: bundled dev hot updates only when Rolldown reports a module update, and such an edit leaves the module code of the HTML entry unchanged (no-op update); a fix could be, e.g., that bundled dev reloads the page when the HTML output of the entry changes, while edits to inline module scripts stay module updates',
    { vite: [23194] },
  )

  test('full-reload encodeURI path', htmlEditTodo, async () => {
    await page.goto(
      viteTestUrl + '/unicode-path/中文-にほんご-한글-🌕🌖🌗/index.html',
    )
    const el = page.locator('#app')
    await expect.poll(() => el.textContent()).toBe('title')
    editFile('unicode-path/中文-にほんご-한글-🌕🌖🌗/index.html', (code) =>
      code.replace('title', 'title2'),
    )
    await page.waitForEvent('load')
    await expect.poll(() => el.textContent()).toBe('title2')
  })

  const cssLinkUnsupported = bundledDevUnsupported(
    'bundled dev turns a `<link rel="stylesheet">` to a project CSS file (without `media` or `disabled`) into a CSS import, served as a `<style>` injected by a JS module, so there is no `<link>` tag to swap on a CSS edit; the edit still hot updates in place',
  )

  test('CSS update preserves query params', cssLinkUnsupported, async () => {
    await page.goto(viteTestUrl)

    editFile('global.css', (code) => code.replace('white', 'tomato'))

    const elprev = page.locator('.css-prev')
    const elpost = page.locator('.css-post')
    await expect.poll(() => elprev.textContent()).toMatch('param=required')
    await expect.poll(() => elpost.textContent()).toMatch('param=required')
    const textprev = await elprev.textContent()
    const textpost = await elpost.textContent()
    expect(textprev).not.toBe(textpost)
    expect(textprev).not.toMatch('direct')
    expect(textpost).not.toMatch('direct')
  })

  test('it swaps out link tags', cssLinkUnsupported, async () => {
    await page.goto(viteTestUrl)

    editFile('global.css', (code) => code.replace('tomato', 'white'))

    await expect
      .poll(() => page.locator('.link-tag-added').textContent())
      .toMatch('yes')
    await expect
      .poll(() => page.locator('.link-tag-removed').textContent())
      .toMatch('yes')

    await expect.poll(() => page.locator('link').count()).toBe(1)
  })

  test('not loaded dynamic import', async () => {
    await page.goto(viteTestUrl + '/counter/index.html', { waitUntil: 'load' })

    const btn = page.locator('button')
    await expect.poll(() => btn.textContent()).toBe('Counter 0')
    await btn.click()
    await expect.poll(() => btn.textContent()).toBe('Counter 1')

    // Modifying `index.ts` triggers a page reload, as expected
    const indexTsLoadPromise = page.waitForEvent('load')
    editFile('counter/index.ts', (code) => code + '\nglobalThis.__edited = 1\n')
    await indexTsLoadPromise
    await expect.poll(() => btn.textContent()).toBe('Counter 0')

    await btn.click()
    await expect.poll(() => btn.textContent()).toBe('Counter 1')

    // #7561
    // `dep.ts` defines `import.module.hot.accept` and has not been loaded.
    // Therefore, modifying it has no effect (doesn't trigger a page reload).
    // (Note that, a dynamic import that is never loaded and that does not
    // define `accept.module.hot.accept` may wrongfully trigger a full page
    // reload, see discussion at #7561.)
    const depTsLoadPromise = page.waitForEvent('load', { timeout: 1000 })
    editFile('counter/dep.ts', (code) => code + '\nexport const edited = 1\n')
    await expect(depTsLoadPromise).rejects.toThrow(
      /page\.waitForEvent: Timeout \d+ms exceeded while waiting for event "load"/,
    )

    await expect.poll(() => btn.textContent()).toBe('Counter 1')
  })

  // #2255
  test('importing reloaded', async () => {
    await page.goto(viteTestUrl)
    const outputEle = page.locator('.importing-reloaded')
    const getOutput = () => {
      return outputEle.innerHTML()
    }

    await expect
      .poll(getOutput)
      .toMatch(['a.js: a0', 'b.js: b0,a0'].join('<br>'))

    editFile('importing-updated/a.js', (code) => code.replace("'a0'", "'a1' "))
    await expect
      .poll(getOutput)
      .toMatch(['a.js: a0', 'b.js: b0,a0', 'a.js: a1'].join('<br>'))

    editFile('importing-updated/b.js', (code) =>
      code.replace('`b0,${a}`', '`b1,${a}` '),
    )
    // note that "a.js: a1" should not happen twice after "b.js: b0,a0'"
    await expect
      .poll(getOutput)
      .toMatch(
        ['a.js: a0', 'b.js: b0,a0', 'a.js: a1', 'b.js: b1,a1'].join('<br>'),
      )
  })

  describe('acceptExports', () => {
    const HOT_UPDATED = /hot updated/
    const CONNECTED = /connected/

    const baseDir = 'accept-exports'
    const openPage = (testDir: string) =>
      gotoLatestBuild(`${viteTestUrl}/${testDir}/`)

    describe('when all used exports are accepted', () => {
      const testDir = baseDir + '/main-accepted'

      const fileName = 'target.ts'
      const file = `${testDir}/${fileName}`

      let dep = 'dep0'

      beforeAll(async () => {
        await untilBrowserLogAfter(
          () => openPage(testDir),
          [CONNECTED, />>>>>>/],
          (logs) => {
            expect(logs).toContain(`<<<<<< A0 B0 D0 ; ${dep}`)
            expect(logs).toContain('>>>>>> A0 D0')
          },
        )
      })

      it('the callback is called with the new version the module', async () => {
        const callbackFile = `${testDir}/callback.ts`

        await untilBrowserLogAfter(
          () => {
            editFile(callbackFile, (code) =>
              code
                .replace("x = 'X'", "x = 'Y'")
                .replace('reloaded >>>', 'reloaded (2) >>>'),
            )
          },
          HOT_UPDATED,
          (logs) => {
            expect(logs).toEqual([
              'reloaded >>> Y',
              hotUpdatedLog(callbackFile),
            ])
          },
        )

        await untilBrowserLogAfter(
          () => {
            editFile(callbackFile, (code) =>
              code.replace("x = 'Y'", "x = 'Z' "),
            )
          },
          HOT_UPDATED,
          (logs) => {
            expect(logs).toEqual([
              'reloaded (2) >>> Z',
              hotUpdatedLog(callbackFile),
            ])
          },
        )
      })

      it('stops HMR bubble on dependency change', async () => {
        const depFileName = 'dep.ts'
        const depFile = `${testDir}/${depFileName}`

        await untilBrowserLogAfter(
          () => {
            editFile(
              depFile,
              (code) => code.replace('dep0', (dep = 'dep1')) + '\n',
            )
          },
          HOT_UPDATED,
          (logs) => {
            expect(logs).toEqual([
              `<<<<<< A0 B0 D0 ; ${dep}`,
              hotUpdatedLog(file),
            ])
          },
        )
      })

      it('accepts itself and refreshes on change', async () => {
        await untilBrowserLogAfter(
          () => {
            editFile(file, (code) => code.replace(/(\b[A-Z])0/g, '$11') + '\n')
          },
          HOT_UPDATED,
          (logs) => {
            expect(logs).toEqual([
              `<<<<<< A1 B1 D1 ; ${dep}`,
              hotUpdatedLog(file),
            ])
          },
        )
      })

      it('accepts itself and refreshes on 2nd change', async () => {
        await untilBrowserLogAfter(
          () => {
            editFile(
              file,
              (code) =>
                code
                  .replace(/(\b[A-Z])1/g, '$12')
                  .replace(
                    "acceptExports(['a', 'default']",
                    "acceptExports(['b', 'default']",
                  ) + '\n',
            )
          },
          HOT_UPDATED,
          (logs) => {
            expect(logs).toEqual([
              `<<<<<< A2 B2 D2 ; ${dep}`,
              hotUpdatedLog(file),
            ])
          },
        )
      })

      it('does not accept itself anymore after acceptedExports change', async () => {
        await untilBrowserLogAfter(
          async () => {
            editFile(file, (code) => code.replace(/(\b[A-Z])2/g, '$13') + '\n')
            await page.waitForEvent('load')
          },
          [CONNECTED, />>>>>>/],
          (logs) => {
            expect(logs).toContain(`<<<<<< A3 B3 D3 ; ${dep}`)
            expect(logs).toContain('>>>>>> A3 D3')
          },
        )
      })
    })

    describe('when some used exports are not accepted', () => {
      const testDir = baseDir + '/main-non-accepted'

      const namedFileName = 'named.ts'
      const namedFile = `${testDir}/${namedFileName}`
      const defaultFileName = 'default.ts'
      const defaultFile = `${testDir}/${defaultFileName}`
      const depFileName = 'dep.ts'
      const depFile = `${testDir}/${depFileName}`

      const a = 'A0'
      let dep = 'dep0'

      beforeAll(async () => {
        await untilBrowserLogAfter(
          () => openPage(testDir),
          [CONNECTED, />>>>>>/],
          (logs) => {
            expect(logs).toContain(`<<< named: ${a} ; ${dep}`)
            expect(logs).toContain(`<<< default: def0`)
            expect(logs).toContain(`>>>>>> ${a} def0`)
          },
        )
      })

      it('does not stop the HMR bubble on change to dep', async () => {
        await untilBrowserLogAfter(
          async () => {
            editFile(
              depFile,
              (code) => code.replace('dep0', (dep = 'dep1')) + '\n',
            )
            await page.waitForEvent('load')
          },
          [CONNECTED, />>>>>>/],
          (logs) => {
            expect(logs).toContain(`<<< named: ${a} ; ${dep}`)
          },
        )
      })

      describe('does not stop the HMR bubble on change to self', () => {
        it('with named exports', async () => {
          await untilBrowserLogAfter(
            async () => {
              editFile(namedFile, (code) => code.replace(a, 'A1') + '\n')
              await page.waitForEvent('load')
            },
            [CONNECTED, />>>>>>/],
            (logs) => {
              expect(logs).toContain(`<<< named: A1 ; ${dep}`)
            },
          )
        })

        it('with default export', async () => {
          await untilBrowserLogAfter(
            async () => {
              editFile(
                defaultFile,
                (code) => code.replace('def0', 'def1') + '\n',
              )
              await page.waitForEvent('load')
            },
            [CONNECTED, />>>>>>/],
            (logs) => {
              expect(logs).toContain(`<<< default: def1`)
            },
          )
        })
      })
    })

    test('accepts itself when imported for side effects only (no bindings imported)', async () => {
      const testDir = baseDir + '/side-effects'
      const file = 'side-effects.ts'

      await untilBrowserLogAfter(
        () => openPage(testDir),
        [CONNECTED, />>>/],
        (logs) => {
          expect(logs).toContain('>>> side FX')
        },
      )

      await untilBrowserLogAfter(
        () => {
          editFile(`${testDir}/${file}`, (code) =>
            code.replace('>>> side FX', '>>> side FX !!'),
          )
        },
        HOT_UPDATED,
        (logs) => {
          expect(logs).toEqual([
            '>>> side FX !!',
            hotUpdatedLog(`${testDir}/${file}`),
          ])
        },
      )
    })

    describe('acceptExports([])', () => {
      const testDir = baseDir + '/unused-exports'

      test('accepts itself if no exports are imported', async () => {
        const fileName = 'unused.ts'
        const file = `${testDir}/${fileName}`

        await untilBrowserLogAfter(
          () => openPage(testDir),
          [CONNECTED, '-- unused --'],
          (logs) => {
            expect(logs).toContain('-- unused --')
          },
        )

        await untilBrowserLogAfter(
          () => {
            editFile(
              file,
              (code) => code.replace('-- unused --', '-> unused <-') + '\n',
            )
          },
          HOT_UPDATED,
          (logs) => {
            expect(logs).toEqual(['-> unused <-', hotUpdatedLog(file)])
          },
        )
      })

      test("doesn't accept itself if any of its exports is imported", async () => {
        const fileName = 'used.ts'
        const file = `${testDir}/${fileName}`

        await untilBrowserLogAfter(
          () => openPage(testDir),
          [CONNECTED, '-- used --'],
          (logs) => {
            expect(logs).toContain('-- used --')
            expect(logs).toContain('used:foo0')
          },
        )

        await untilBrowserLogAfter(
          async () => {
            editFile(
              file,
              (code) =>
                code
                  .replace('foo0', 'foo1')
                  .replace('-- used --', '-> used <-') + '\n',
            )
            await page.waitForEvent('load')
          },
          [CONNECTED, /used:foo/],
          (logs) => {
            expect(logs).toContain('-> used <-')
            expect(logs).toContain('used:foo1')
          },
        )
      })
    })

    describe('indiscriminate imports: import *', () => {
      const testStarExports = (testDirName: string) => {
        const testDir = `${baseDir}/${testDirName}`

        it('accepts itself if all its exports are accepted', async () => {
          const fileName = 'deps-all-accepted.ts'
          const file = `${testDir}/${fileName}`

          await untilBrowserLogAfter(
            () => openPage(testDir),
            [CONNECTED, '>>> ready <<<'],
            (logs) => {
              expect(logs).toContain('loaded:all:a0b0c0default0')
              expect(logs).toContain('all >>>>>> a0, b0, c0')
            },
          )

          await untilBrowserLogAfter(
            () => {
              editFile(file, (code) => code.replace(/([abc])0/g, '$11') + '\n')
            },
            HOT_UPDATED,
            (logs) => {
              expect(logs).toEqual([
                'all >>>>>> a1, b1, c1',
                hotUpdatedLog(file),
              ])
            },
          )

          await untilBrowserLogAfter(
            () => {
              editFile(file, (code) => code.replace(/([abc])1/g, '$12') + '\n')
            },
            HOT_UPDATED,
            (logs) => {
              expect(logs).toEqual([
                'all >>>>>> a2, b2, c2',
                hotUpdatedLog(file),
              ])
            },
          )
        })

        it("doesn't accept itself if one export is not accepted", async () => {
          const fileName = 'deps-some-accepted.ts'
          const file = `${testDir}/${fileName}`

          await untilBrowserLogAfter(
            () => openPage(testDir),
            [CONNECTED, '>>> ready <<<'],
            (logs) => {
              expect(logs).toContain('loaded:some:a0b0c0default0')
              expect(logs).toContain('some >>>>>> a0, b0, c0')
            },
          )

          await untilBrowserLogAfter(
            async () => {
              const loadPromise = page.waitForEvent('load')
              editFile(file, (code) => code.replace(/([abc])0/g, '$11') + '\n')
              await loadPromise
            },
            [CONNECTED, '>>> ready <<<'],
            (logs) => {
              expect(logs).toContain('loaded:some:a1b1c1default0')
              expect(logs).toContain('some >>>>>> a1, b1, c1')
            },
          )
        })
      }

      describe('import * from ...', () => testStarExports('star-imports'))

      describe('dynamic import(...)', () => testStarExports('dynamic-imports'))
    })
  })

  const inlineStyleEditTodo = bundledDevTodo(
    'An inline `<style>` in an HTML entry goes through the build pipeline: it becomes an `index.html?html-proxy&inline-css&index=N.css` module that goes through the CSS pipeline and writes the CSS back into the HTML output. But editing `index.html` does not invalidate that module, which is a bug, so the CSS pipeline does not run again and the HTML output stays unchanged',
    { vite: [23194], rolldown: [10962] },
  )

  test('css in html hmr', inlineStyleEditTodo, async () => {
    await page.goto(viteTestUrl)
    await expect.poll(() => getBg('.import-image')).toMatch('icon')
    await page.goto(viteTestUrl + '/foo/', { waitUntil: 'load' })
    await expect.poll(() => getBg('.import-image')).toMatch('icon')

    const loadPromise = page.waitForEvent('load')
    editFile('index.html', (code) => code.replace("url('./icon.png')", ''))
    await loadPromise
    await expect.poll(() => getBg('.import-image')).toMatch('')
  })

  test('HTML', htmlEditTodo, async () => {
    await page.goto(viteTestUrl + '/counter/index.html')
    const btn = page.locator('button')
    await expect.poll(() => btn.textContent()).toBe('Counter 0')

    const loadPromise = page.waitForEvent('load')
    editFile('counter/index.html', (code) =>
      code.replace('Counter', 'Compteur'),
    )
    await loadPromise
    await expect.poll(() => btn.textContent()).toBe('Compteur 0')
  })

  test('handle virtual module updates', async () => {
    await page.goto(viteTestUrl)
    const el = page.locator('.virtual')
    await expect.poll(() => el.textContent()).toBe('[success]0')
    editFile('importedVirtual.js', (code) => code.replace('[success]', '[wow]'))
    await expect.poll(() => el.textContent()).toBe('[wow]0')
  })

  const reloadModuleTodo = bundledDevTodo(
    '`environment.reloadModule()` has no effect under bundled dev: the client module graph is empty, so a plugin cannot find the module to pass, `reloadModule` only has the unbundled update path, and Rolldown has no API to rebuild one module without a file change',
  )

  test('invalidate virtual module', reloadModuleTodo, async () => {
    await page.goto(viteTestUrl)
    const el = page.locator('.virtual')
    await expect.poll(() => el.textContent()).toBe('[wow]0')
    await page.locator('.virtual-update').click()
    await expect.poll(() => el.textContent()).toBe('[wow]1')
  })

  test('handle virtual module accept updates', async () => {
    await page.goto(viteTestUrl)
    const el = page.locator('.virtual-dep')
    await expect.poll(() => el.textContent()).toBe('0')
    editFile('importedVirtual.js', (code) => code.replace('[wow]', '[wow2]'))
    await expect.poll(() => el.textContent()).toBe('[wow2]0')
  })

  test('invalidate virtual module and accept', reloadModuleTodo, async () => {
    await page.goto(viteTestUrl)
    const el = page.locator('.virtual-dep')
    await expect.poll(() => el.textContent()).toBe('0')
    await page.locator('.virtual-update-dep').click()
    await expect.poll(() => el.textContent()).toBe('[wow2]2')
  })

  const unresolvedImportTodo = bundledDevTodo(
    'Fixing an unresolved bare import does not reload the page: Rolldown treats the import as external and keeps `import "missing-modules"` in the output, so the chunk fails to load in the browser before any of its modules run, and the client applies an update only to modules that have run on the page, so the edit that fixes the import is ignored',
  )

  test(
    'keep hmr reload after missing import on server startup',
    unresolvedImportTodo,
    async () => {
      const file = 'missing-import/a.js'
      const importCode = "import 'missing-modules'"
      const unImportCode = `// ${importCode}`

      await untilBrowserLogAfter(
        () =>
          page.goto(viteTestUrl + '/missing-import/index.html', {
            waitUntil: 'load',
          }),
        /connected/, // wait for HMR connection
      )

      await untilBrowserLogAfter(async () => {
        const loadPromise = page.waitForEvent('load')
        editFile(file, (code) => code.replace(importCode, unImportCode))
        await loadPromise
      }, ['missing test', /connected/])

      await untilBrowserLogAfter(async () => {
        const loadPromise = page.waitForEvent('load')
        editFile(file, (code) => code.replace(unImportCode, importCode))
        await loadPromise
      }, [/500/, /connected/])
    },
  )

  const pruneEventTodo = bundledDevTodo(
    'A module that is no longer imported is not pruned under bundled dev: the server never sends a `prune` message, so the `hot.dispose` and `hot.prune` callbacks of that module never run',
  )

  test(
    'should hmr when file is deleted and restored',
    pruneEventTodo,
    async () => {
      await page.goto(viteTestUrl)

      const parentFile = 'file-delete-restore/parent.js'
      const childFile = 'file-delete-restore/child.js'

      await expect
        .poll(() => page.textContent('.file-delete-restore'))
        .toMatch('parent:child')

      editFile(childFile, (code) =>
        code.replace("value = 'child'", "value = 'child1'"),
      )
      await expect
        .poll(() => page.textContent('.file-delete-restore'))
        .toMatch('parent:child1')

      // delete the file
      editFile(parentFile, (code) =>
        code.replace(
          "export { value as childValue } from './child'",
          "export const childValue = 'not-child'",
        ),
      )
      const originalChildFileCode = readFile(childFile)
      await Promise.all([
        untilBrowserLogAfter(
          () => removeFile(childFile),
          `${childFile} is disposed`,
        ),
        expect
          .poll(() => page.textContent('.file-delete-restore'))
          .toMatch('parent:not-child'),
      ])

      await untilBrowserLogAfter(async () => {
        const loadPromise = page.waitForEvent('load')
        addFile(childFile, originalChildFileCode)
        editFile(parentFile, (code) =>
          code.replace(
            "export const childValue = 'not-child'",
            "export { value as childValue } from './child'",
          ),
        )
        await loadPromise
      }, [/connected/])
      await expect
        .poll(() => page.textContent('.file-delete-restore'))
        .toMatch('parent:child')
    },
  )

  test('delete file should not break hmr', async () => {
    await page.goto(viteTestUrl)

    await expect
      .poll(() => page.textContent('.intermediate-file-delete-display'))
      .toBe('count is 1')

    // add state
    await page.click('.intermediate-file-delete-increment')
    await expect
      .poll(() => page.textContent('.intermediate-file-delete-display'))
      .toBe('count is 2')

    // update import, hmr works
    editFile('intermediate-file-delete/index.js', (code) =>
      code.replace("from './re-export.js'", "from './display.js'"),
    )
    editFile('intermediate-file-delete/display.js', (code) =>
      code.replace('count is ${count}', 'count is ${count}!'),
    )
    await expect
      .poll(() => page.textContent('.intermediate-file-delete-display'))
      .toBe('count is 2!')

    // remove unused file. Plain dev reloads the page, because the file is now
    // an entry point in its module graph. Bundled dev keeps the page as is: the
    // file is no longer in the bundle, so nothing changes.
    removeFile('intermediate-file-delete/re-export.js')
    await expect
      .poll(() => page.textContent('.intermediate-file-delete-display'))
      .toBe(isBundledDev ? 'count is 2!' : 'count is 1!')

    // re-add state
    await page.click('.intermediate-file-delete-increment')
    await expect
      .poll(() => page.textContent('.intermediate-file-delete-display'))
      .toBe(isBundledDev ? 'count is 3!' : 'count is 2!')

    // hmr works after file deletion
    editFile('intermediate-file-delete/display.js', (code) =>
      code.replace('count is ${count}!', 'count is ${count}'),
    )
    await expect
      .poll(() => page.textContent('.intermediate-file-delete-display'))
      .toBe(isBundledDev ? 'count is 3' : 'count is 2')
  })

  test(
    'deleted file should trigger dispose and prune callbacks',
    pruneEventTodo,
    async () => {
      await page.goto(viteTestUrl)

      const parentFile = 'file-delete-restore/parent.js'
      const childFile = 'file-delete-restore/child.js'
      const originalChildFileCode = readFile(childFile)

      await untilBrowserLogAfter(
        () => {
          // delete the file
          editFile(parentFile, (code) =>
            code.replace(
              "export { value as childValue } from './child'",
              "export const childValue = 'not-child'",
            ),
          )
          removeFile(childFile)
        },
        [
          'file-delete-restore/child.js is disposed',
          'file-delete-restore/child.js is pruned',
        ],
        false,
      )
      await expect
        .poll(() => page.textContent('.file-delete-restore'))
        .toMatch('parent:not-child')

      // restore the file
      await untilBrowserLogAfter(() => {
        addFile(childFile, originalChildFileCode)
        editFile(parentFile, (code) =>
          code.replace(
            "export const childValue = 'not-child'",
            "export { value as childValue } from './child'",
          ),
        )
      }, 'file-delete-restore/child.js hot data after prune: undefined')
      await expect
        .poll(() => page.textContent('.file-delete-restore'))
        .toMatch('parent:child')
    },
  )

  const buildErrorRecoveryTodo = bundledDevTodo(
    'Recovering from a build error reloads the page if no update was applied on it since it loaded. The client reloads when the first update arrives while the error overlay is shown. Here the page opened fine, and the hot-update patch would apply',
  )

  test(
    'restoring a deleted file that is still imported hot updates',
    buildErrorRecoveryTodo,
    async () => {
      // load the page again: the client reloads instead of applying the
      // recovery update only when no update was applied since the page loaded
      await page.goto(viteTestUrl)

      const childFile = 'file-delete-restore/child.js'
      const originalChildFileCode = readFile(childFile)

      await expect
        .poll(() => page.textContent('.file-delete-restore'))
        .toMatch('parent:child')
      await page.evaluate(() => {
        ;(window as any).__notReloaded = true
      })

      await untilBrowserLogAfter(
        () => removeFile(childFile),
        isBundledDev ? />>> vite:error/ : /Failed to reload/,
      )
      await untilBrowserLogAfter(
        () => addFile(childFile, originalChildFileCode),
        'file-delete-restore/child.js is disposed',
      )
      expect(await page.evaluate(() => (window as any).__notReloaded)).toBe(
        true,
      )
    },
  )

  test(
    'deleting import from non-self-accepting module can trigger prune event',
    pruneEventTodo,
    async () => {
      await page.goto(viteTestUrl)
      await expect.poll(() => page.textContent('.prune')).toMatch('prune-init')
      editFile('prune/dep1.js', (code) =>
        code.replace(`import './dep2.js'`, `// import './dep2.js'`),
      )
      // Prune is triggered when there are other dependencies.
      await expect
        .poll(() => page.textContent('.prune'))
        .toMatch('prune-init|dep2-disposed|dep2-pruned')
      editFile('prune/dep1.js', (code) =>
        code.replace(`import './dep3.js'`, `// import './dep3.js'`),
      )
      // Prune is triggered when there are no more dependencies.
      await expect
        .poll(() => page.textContent('.prune'))
        .toMatch(
          'prune-init|dep2-disposed|dep2-pruned|dep3-disposed|dep3-pruned',
        )
    },
  )

  test('importing an unused file again should not use old code', async () => {
    await page.goto(viteTestUrl)

    const display = () => page.textContent('.orphan-reimport-display')

    await expect.poll(display).toBe('count is 1')

    await page.click('.orphan-reimport-increment')
    await expect.poll(display).toBe('count is 2')

    // re-export.js is no longer imported
    await untilBrowserLogAfter(
      () =>
        editFile('orphan-reimport/index.js', (code) =>
          code.replace("from './re-export.js'", "from './display.js'"),
        ),
      hotUpdatedLog('orphan-reimport/index.js'),
    )

    // update a dependency of re-export.js. Plain dev reloads the page, because
    // re-export.js has no importers, so it is an entry point in its module graph.
    // Bundled dev applies the update and stops at re-export.js.
    editFile('orphan-reimport/display.js', (code) =>
      code.replace('count is ${count}', 'count is ${count}!'),
    )
    await expect
      .poll(display)
      .toBe(isBundledDev ? 'count is 2!' : 'count is 1!')

    // import re-export.js again
    await untilBrowserLogAfter(
      () =>
        editFile('orphan-reimport/index.js', (code) =>
          code.replace("from './display.js'", "from './re-export.js'"),
        ),
      hotUpdatedLog('orphan-reimport/index.js'),
    )
    await expect
      .poll(display)
      .toBe(isBundledDev ? 'count is 2!' : 'count is 1!')
  })

  test('updating a file that only an unused file imports should not keep old code', async () => {
    await page.goto(viteTestUrl)

    const display = () => page.textContent('.orphan-no-boundary-display')

    await expect.poll(display).toBe('count is 1')

    await page.click('.orphan-no-boundary-increment')
    await expect.poll(display).toBe('count is 2')

    // re-export.js and display.js are no longer imported
    await untilBrowserLogAfter(
      () =>
        editFile('orphan-no-boundary/index.js', (code) =>
          code.replace("from './re-export.js'", "from './local.js'"),
        ),
      hotUpdatedLog('orphan-no-boundary/index.js'),
    )
    await expect.poll(display).toBe('local 2')

    // update display.js. Plain dev reloads the page, because re-export.js has
    // no importers, so it is an entry point in its module graph. Bundled dev
    // finds no hmr boundary, so nothing runs again and no update is logged.
    // Wait for the dispose log instead, so that this edit is handled on its own
    // and not in the same update as the next edit.
    const editDisplay = () =>
      editFile('orphan-no-boundary/display.js', (code) =>
        code.replace('count is ${count}', 'count is ${count}!'),
      )
    if (isBundledDev) {
      await untilBrowserLogAfter(
        editDisplay,
        '[orphan-no-boundary] re-export.js disposed',
      )
    } else {
      editDisplay()
    }
    await expect.poll(display).toBe(isBundledDev ? 'local 2' : 'local 1')

    // import re-export.js again
    await untilBrowserLogAfter(
      () =>
        editFile('orphan-no-boundary/index.js', (code) =>
          code.replace("from './local.js'", "from './re-export.js'"),
        ),
      hotUpdatedLog('orphan-no-boundary/index.js'),
    )
    await expect
      .poll(display)
      .toBe(isBundledDev ? 'count is 2!' : 'count is 1!')
  })

  test('import.meta.hot?.accept', async () => {
    await gotoLatestBuild(viteTestUrl)

    const el = page.locator('.optional-chaining')
    await untilBrowserLogAfter(
      () =>
        editFile(
          'optional-chaining/child.js',
          (code) => code.replace('const foo = 1', 'const foo = 2') + '\n',
        ),
      '(optional-chaining) child update',
    )
    await expect.poll(() => el.textContent()).toMatch('2')
  })

  test('hmr works for self-accepted module within circular imported files', async () => {
    await page.goto(viteTestUrl + '/self-accept-within-circular/index.html')
    const el = page.locator('.self-accept-within-circular')
    await expect.poll(() => el.textContent()).toBe('c')
    const lastServerLogIndex = serverLogs.length
    editFile('self-accept-within-circular/c.js', (code) =>
      code.replace(`export const c = 'c'`, `export const c = 'cc'`),
    )
    await expect.poll(() => el.textContent()).toBe('cc')
    // Should still keep hmr update, but it'll error on the browser-side and will refresh itself.
    expect(
      serverLogs.slice(lastServerLogIndex).map(stripVTControlCharacters),
    ).toContain(
      isBundledDev
        ? 'hmr update playground-temp/hmr/self-accept-within-circular/c.js'
        : 'hmr update /self-accept-within-circular/c.js',
    )
  })

  test('hmr should not reload if no accepted within circular imported files', async () => {
    await page.goto(viteTestUrl + '/circular/index.html')
    const el = page.locator('.circular')
    await expect
      .poll(() => el.textContent())
      .toBe(
        isBundledDev
          ? // bundled-dev: `unexpected no error` is shown instead of `expected error`.
            // Vite uses `output.topLevelVar = true` by default in bundled dev, which causes the circular import to be `undefined` instead of throwing a TDZ error,
            // (see https://rolldown.rs/guide/troubleshooting#avoid-relying-on-temporal-dead-zone-tdz-errors),
            // whereas in unbundled dev, it follows TDZ and shows `expected error`.
            'mod-a -> mod-b -> mod-c -> undefined (unexpected no error)'
          : 'mod-a -> mod-b -> mod-c -> mod-a (expected error)',
      )
    editFile('circular/mod-b.js', (code) =>
      code.replace(`mod-b ->`, `mod-b (edited) ->`),
    )
    await expect
      .poll(() => el.textContent())
      .toBe('mod-a -> mod-b (edited) -> mod-c -> mod-a (expected error)')
  })

  const assetWatchTodo = bundledDevTodo(
    'Editing an imported asset file (for example an `.svg`) pushes no update, because nothing watches the file. When a plugin `load` hook returns the content, the plugin must register the file. `vite:asset` does not call `this.addWatchFile` for an inlined asset. For an emitted asset it sets `originalFileName`, which Rolldown documents as watching the file, but Rolldown does not watch it',
    { rolldown: [10962] },
  )

  test('not inlined assets HMR', assetWatchTodo, async () => {
    await page.goto(viteTestUrl)
    const el = page.locator('#logo-no-inline')
    await untilBrowserLogAfter(
      () =>
        editFile('logo-no-inline.svg', (code) =>
          code.replace('height="30px"', 'height="40px" '),
        ),
      /Logo-no-inline updated/,
    )
    await expect
      .poll(() => el.evaluate((it) => `${it.clientHeight}`))
      .toMatch('40')
  })

  test('inlined assets HMR', assetWatchTodo, async () => {
    await page.goto(viteTestUrl)
    const el = page.locator('#logo')
    await untilBrowserLogAfter(
      () =>
        editFile('logo.svg', (code) =>
          code.replace('height="30px"', 'height="40px" '),
        ),
      /Logo updated/,
    )
    await expect
      .poll(() => el.evaluate((it) => `${it.clientHeight}`))
      .toMatch('40')
  })

  test('CSS HMR with this.addWatchFile', async () => {
    await page.goto(viteTestUrl + '/css-deps/index.html')
    await expect.poll(() => getColor('.css-deps')).toBe('red')
    editFile('css-deps/dep.js', (code) => code.replace(`red`, `green`))
    await expect.poll(() => getColor('.css-deps')).toBe('green')
  })

  const missingFileTodo = bundledDevTodo(
    'This test should move to a standalone playground. Bundled dev builds all pages in one build, so a page whose import is missing when the server starts fails the build for every page. So `missing-file/index.html` is not a build input here, and under bundled dev the test opens the root page. Even in a standalone playground, creating the missing file does not recover the build, because the dev engine does not watch missing import paths',
  )

  test(
    'hmr should happen after missing file is created',
    missingFileTodo,
    async () => {
      const file = 'missing-file/a.js'
      const code = 'console.log("a.js")'

      await untilBrowserLogAfter(
        () =>
          page.goto(viteTestUrl + '/missing-file/index.html', {
            waitUntil: 'load',
          }),
        /connected/, // wait for HMR connection
      )

      await untilBrowserLogAfter(async () => {
        const loadPromise = page.waitForEvent('load')
        addFile(file, code)
        await loadPromise
      }, [/connected/, 'a.js'])
    },
  )

  const ssrCssLinkUnsupported = bundledDevUnsupported(
    'A server-rendered `<link>` to a source CSS file cannot work under bundled dev. Bundled dev never serves a single project file, and CSS reaches the page only through JS modules, so there is no CSS URL to link to',
  )

  test(
    'deduplicate server rendered link stylesheet',
    ssrCssLinkUnsupported,
    async () => {
      await page.goto(viteTestUrl + '/css-link/index.html')
      await expect.poll(() => getColor('.test-css-link')).toBe('orange')

      // remove color
      editFile('css-link/styles.css', (code) =>
        code.replace('color: orange;', '/* removed */'),
      )
      await expect.poll(() => getColor('.test-css-link')).toBe('black')

      // add color
      editFile('css-link/styles.css', (code) =>
        code.replace('/* removed */', 'color: blue;'),
      )
      await expect.poll(() => getColor('.test-css-link')).toBe('blue')

      // // remove css import from js
      editFile('css-link/main.js', (code) =>
        code.replace(`import './styles.css'`, ``),
      )
      await expect.poll(() => getColor('.test-css-link')).toBe('black')
    },
  )

  test('reuse server rendered style without rewriting unchanged css', async () => {
    await page.goto(viteTestUrl + '/css-style/index.html')
    await page.waitForFunction(() => (window as any).__cssStyleLoaded)
    await expect.poll(() => getColor('.test-css-style')).toBe('orange')
    expect(
      await page.evaluate(() => [
        document.querySelectorAll('style[data-vite-dev-id]').length,
        (window as any).__ssrStyleMutations,
      ]),
    ).toStrictEqual([1, 0])

    editFile('css-style/styles.css', (code) =>
      code.replace('color: orange;', 'color: blue;'),
    )
    await expect.poll(() => getColor('.test-css-style')).toBe('blue')
    expect(await page.locator('style[data-vite-dev-id]').count()).toBe(1)
  })
}

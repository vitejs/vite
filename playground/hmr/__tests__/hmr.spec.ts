import { beforeAll, describe, expect, it, test } from 'vitest'
import {
  addFile,
  browserLogs,
  editFile,
  getBg,
  isBuild,
  page,
  removeFile,
  untilBrowserLogAfter,
  untilUpdated,
  viteTestUrl,
} from '~utils'

test('should render', async () => {
  expect(await page.textContent('.app')).toBe('1')
  expect(await page.textContent('.dep')).toBe('1')
  expect(await page.textContent('.nested')).toBe('1')
})

if (!isBuild) {
  test('should connect', async () => {
    expect(browserLogs.length).toBe(3)
    expect(browserLogs.some((msg) => msg.match('connected'))).toBe(true)
    browserLogs.length = 0
  })

  test('self accept', async () => {
    const el = await page.$('.app')
    await untilBrowserLogAfter(
      () =>
        editFile('hmr.ts', (code) =>
          code.replace('const foo = 1', 'const foo = 2'),
        ),
      [
        '>>> vite:beforeUpdate -- update',
        'foo was: 1',
        '(self-accepting 1) foo is now: 2',
        '(self-accepting 2) foo is now: 2',
        '[vite] hot updated: /hmr.ts',
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await untilUpdated(() => el.textContent(), '2')

    await untilBrowserLogAfter(
      () =>
        editFile('hmr.ts', (code) =>
          code.replace('const foo = 2', 'const foo = 3'),
        ),
      [
        '>>> vite:beforeUpdate -- update',
        'foo was: 2',
        '(self-accepting 1) foo is now: 3',
        '(self-accepting 2) foo is now: 3',
        '[vite] hot updated: /hmr.ts',
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await untilUpdated(() => el.textContent(), '3')
  })

  test('accept dep', async () => {
    const el = await page.$('.dep')
    await untilBrowserLogAfter(
      () =>
        editFile('hmrDep.js', (code) =>
          code.replace('const foo = 1', 'const foo = 2'),
        ),
      [
        '>>> vite:beforeUpdate -- update',
        '(dep) foo was: 1',
        '(dep) foo from dispose: 1',
        '(single dep) foo is now: 2',
        '(single dep) nested foo is now: 1',
        '(multi deps) foo is now: 2',
        '(multi deps) nested foo is now: 1',
        '[vite] hot updated: /hmrDep.js via /hmr.ts',
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await untilUpdated(() => el.textContent(), '2')

    await untilBrowserLogAfter(
      () =>
        editFile('hmrDep.js', (code) =>
          code.replace('const foo = 2', 'const foo = 3'),
        ),
      [
        '>>> vite:beforeUpdate -- update',
        '(dep) foo was: 2',
        '(dep) foo from dispose: 2',
        '(single dep) foo is now: 3',
        '(single dep) nested foo is now: 1',
        '(multi deps) foo is now: 3',
        '(multi deps) nested foo is now: 1',
        '[vite] hot updated: /hmrDep.js via /hmr.ts',
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await untilUpdated(() => el.textContent(), '3')
  })

  test('nested dep propagation', async () => {
    const el = await page.$('.nested')
    await untilBrowserLogAfter(
      () =>
        editFile('hmrNestedDep.js', (code) =>
          code.replace('const foo = 1', 'const foo = 2'),
        ),
      [
        '>>> vite:beforeUpdate -- update',
        '(dep) foo was: 3',
        '(dep) foo from dispose: 3',
        '(single dep) foo is now: 3',
        '(single dep) nested foo is now: 2',
        '(multi deps) foo is now: 3',
        '(multi deps) nested foo is now: 2',
        '[vite] hot updated: /hmrDep.js via /hmr.ts',
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await untilUpdated(() => el.textContent(), '2')

    await untilBrowserLogAfter(
      () =>
        editFile('hmrNestedDep.js', (code) =>
          code.replace('const foo = 2', 'const foo = 3'),
        ),
      [
        '>>> vite:beforeUpdate -- update',
        '(dep) foo was: 3',
        '(dep) foo from dispose: 3',
        '(single dep) foo is now: 3',
        '(single dep) nested foo is now: 3',
        '(multi deps) foo is now: 3',
        '(multi deps) nested foo is now: 3',
        '[vite] hot updated: /hmrDep.js via /hmr.ts',
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await untilUpdated(() => el.textContent(), '3')
  })

  test('invalidate', async () => {
    const el = await page.$('.invalidation')
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
    await untilUpdated(() => el.textContent(), 'child updated')
  })

  test('plugin hmr handler + custom event', async () => {
    const el = await page.$('.custom')
    editFile('customFile.js', (code) => code.replace('custom', 'edited'))
    await untilUpdated(() => el.textContent(), 'edited')
  })

  test('plugin hmr remove custom events', async () => {
    const el = await page.$('.toRemove')
    editFile('customFile.js', (code) => code.replace('custom', 'edited'))
    await untilUpdated(() => el.textContent(), 'edited')
    editFile('customFile.js', (code) => code.replace('edited', 'custom'))
    await untilUpdated(() => el.textContent(), 'edited')
  })

  test('plugin client-server communication', async () => {
    const el = await page.$('.custom-communication')
    await untilUpdated(() => el.textContent(), '3')
  })

  test('full-reload encodeURI path', async () => {
    await page.goto(
      viteTestUrl + '/unicode-path/中文-にほんご-한글-🌕🌖🌗/index.html',
    )
    const el = await page.$('#app')
    expect(await el.textContent()).toBe('title')
    editFile('unicode-path/中文-にほんご-한글-🌕🌖🌗/index.html', (code) =>
      code.replace('title', 'title2'),
    )
    await page.waitForEvent('load')
    await untilUpdated(
      async () => (await page.$('#app')).textContent(),
      'title2',
    )
  })

  test('CSS update preserves query params', async () => {
    await page.goto(viteTestUrl)

    editFile('global.css', (code) => code.replace('white', 'tomato'))

    const elprev = await page.$('.css-prev')
    const elpost = await page.$('.css-post')
    await untilUpdated(() => elprev.textContent(), 'param=required')
    await untilUpdated(() => elpost.textContent(), 'param=required')
    const textprev = await elprev.textContent()
    const textpost = await elpost.textContent()
    expect(textprev).not.toBe(textpost)
    expect(textprev).not.toMatch('direct')
    expect(textpost).not.toMatch('direct')
  })

  test('it swaps out link tags', async () => {
    await page.goto(viteTestUrl)

    editFile('global.css', (code) => code.replace('white', 'tomato'))

    let el = await page.$('.link-tag-added')
    await untilUpdated(() => el.textContent(), 'yes')

    el = await page.$('.link-tag-removed')
    await untilUpdated(() => el.textContent(), 'yes')

    expect((await page.$$('link')).length).toBe(1)
  })

  test('not loaded dynamic import', async () => {
    await page.goto(viteTestUrl + '/counter/index.html', { waitUntil: 'load' })

    let btn = await page.$('button')
    expect(await btn.textContent()).toBe('Counter 0')
    await btn.click()
    expect(await btn.textContent()).toBe('Counter 1')

    // Modifying `index.ts` triggers a page reload, as expected
    const indexTsLoadPromise = page.waitForEvent('load')
    editFile('counter/index.ts', (code) => code)
    await indexTsLoadPromise
    btn = await page.$('button')
    expect(await btn.textContent()).toBe('Counter 0')

    await btn.click()
    expect(await btn.textContent()).toBe('Counter 1')

    // #7561
    // `dep.ts` defines `import.module.hot.accept` and has not been loaded.
    // Therefore, modifying it has no effect (doesn't trigger a page reload).
    // (Note that, a dynamic import that is never loaded and that does not
    // define `accept.module.hot.accept` may wrongfully trigger a full page
    // reload, see discussion at #7561.)
    const depTsLoadPromise = page.waitForEvent('load', { timeout: 1000 })
    editFile('counter/dep.ts', (code) => code)
    await expect(depTsLoadPromise).rejects.toThrow(
      /page\.waitForEvent: Timeout \d+ms exceeded while waiting for event "load"/,
    )

    btn = await page.$('button')
    expect(await btn.textContent()).toBe('Counter 1')
  })

  // #2255
  test('importing reloaded', async () => {
    await page.goto(viteTestUrl)
    const outputEle = await page.$('.importing-reloaded')
    const getOutput = () => {
      return outputEle.innerHTML()
    }

    await untilUpdated(getOutput, ['a.js: a0', 'b.js: b0,a0'].join('<br>'))

    editFile('importing-updated/a.js', (code) => code.replace("'a0'", "'a1'"))
    await untilUpdated(
      getOutput,
      ['a.js: a0', 'b.js: b0,a0', 'a.js: a1'].join('<br>'),
    )

    editFile('importing-updated/b.js', (code) =>
      code.replace('`b0,${a}`', '`b1,${a}`'),
    )
    // note that "a.js: a1" should not happen twice after "b.js: b0,a0'"
    await untilUpdated(
      getOutput,
      ['a.js: a0', 'b.js: b0,a0', 'a.js: a1', 'b.js: b1,a1'].join('<br>'),
    )
  })

  describe('acceptExports', () => {
    const HOT_UPDATED = /hot updated/
    const CONNECTED = /connected/

    const baseDir = 'accept-exports'

    describe('when all used exports are accepted', () => {
      const testDir = baseDir + '/main-accepted'

      const fileName = 'target.ts'
      const file = `${testDir}/${fileName}`
      const url = '/' + file

      let dep = 'dep0'

      beforeAll(async () => {
        await untilBrowserLogAfter(
          () => page.goto(`${viteTestUrl}/${testDir}/`),
          [CONNECTED, />>>>>>/],
          (logs) => {
            expect(logs).toContain(`<<<<<< A0 B0 D0 ; ${dep}`)
            expect(logs).toContain('>>>>>> A0 D0')
          },
        )
      })

      it('the callback is called with the new version the module', async () => {
        const callbackFile = `${testDir}/callback.ts`
        const callbackUrl = '/' + callbackFile

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
              `[vite] hot updated: ${callbackUrl}`,
            ])
          },
        )

        await untilBrowserLogAfter(
          () => {
            editFile(callbackFile, (code) => code.replace("x = 'Y'", "x = 'Z'"))
          },
          HOT_UPDATED,
          (logs) => {
            expect(logs).toEqual([
              'reloaded (2) >>> Z',
              `[vite] hot updated: ${callbackUrl}`,
            ])
          },
        )
      })

      it('stops HMR bubble on dependency change', async () => {
        const depFileName = 'dep.ts'
        const depFile = `${testDir}/${depFileName}`

        await untilBrowserLogAfter(
          () => {
            editFile(depFile, (code) => code.replace('dep0', (dep = 'dep1')))
          },
          HOT_UPDATED,
          (logs) => {
            expect(logs).toEqual([
              `<<<<<< A0 B0 D0 ; ${dep}`,
              `[vite] hot updated: ${url}`,
            ])
          },
        )
      })

      it('accepts itself and refreshes on change', async () => {
        await untilBrowserLogAfter(
          () => {
            editFile(file, (code) => code.replace(/(\b[A-Z])0/g, '$11'))
          },
          HOT_UPDATED,
          (logs) => {
            expect(logs).toEqual([
              `<<<<<< A1 B1 D1 ; ${dep}`,
              `[vite] hot updated: ${url}`,
            ])
          },
        )
      })

      it('accepts itself and refreshes on 2nd change', async () => {
        await untilBrowserLogAfter(
          () => {
            editFile(file, (code) =>
              code
                .replace(/(\b[A-Z])1/g, '$12')
                .replace(
                  "acceptExports(['a', 'default']",
                  "acceptExports(['b', 'default']",
                ),
            )
          },
          HOT_UPDATED,
          (logs) => {
            expect(logs).toEqual([
              `<<<<<< A2 B2 D2 ; ${dep}`,
              `[vite] hot updated: ${url}`,
            ])
          },
        )
      })

      it('does not accept itself anymore after acceptedExports change', async () => {
        await untilBrowserLogAfter(
          async () => {
            editFile(file, (code) => code.replace(/(\b[A-Z])2/g, '$13'))
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
          () => page.goto(`${viteTestUrl}/${testDir}/`),
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
            editFile(depFile, (code) => code.replace('dep0', (dep = 'dep1')))
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
              editFile(namedFile, (code) => code.replace(a, 'A1'))
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
              editFile(defaultFile, (code) => code.replace('def0', 'def1'))
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
        () => page.goto(`${viteTestUrl}/${testDir}/`),
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
            `[vite] hot updated: /${testDir}/${file}`,
          ])
        },
      )
    })

    describe('acceptExports([])', () => {
      const testDir = baseDir + '/unused-exports'

      test('accepts itself if no exports are imported', async () => {
        const fileName = 'unused.ts'
        const file = `${testDir}/${fileName}`
        const url = '/' + file

        await untilBrowserLogAfter(
          () => page.goto(`${viteTestUrl}/${testDir}/`),
          [CONNECTED, '-- unused --'],
          (logs) => {
            expect(logs).toContain('-- unused --')
          },
        )

        await untilBrowserLogAfter(
          () => {
            editFile(file, (code) =>
              code.replace('-- unused --', '-> unused <-'),
            )
          },
          HOT_UPDATED,
          (logs) => {
            expect(logs).toEqual(['-> unused <-', `[vite] hot updated: ${url}`])
          },
        )
      })

      test("doesn't accept itself if any of its exports is imported", async () => {
        const fileName = 'used.ts'
        const file = `${testDir}/${fileName}`

        await untilBrowserLogAfter(
          () => page.goto(`${viteTestUrl}/${testDir}/`),
          [CONNECTED, '-- used --'],
          (logs) => {
            expect(logs).toContain('-- used --')
            expect(logs).toContain('used:foo0')
          },
        )

        await untilBrowserLogAfter(
          async () => {
            editFile(file, (code) =>
              code.replace('foo0', 'foo1').replace('-- used --', '-> used <-'),
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
          const url = '/' + file

          await untilBrowserLogAfter(
            () => page.goto(`${viteTestUrl}/${testDir}/`),
            [CONNECTED, '>>> ready <<<'],
            (logs) => {
              expect(logs).toContain('loaded:all:a0b0c0default0')
              expect(logs).toContain('all >>>>>> a0, b0, c0')
            },
          )

          await untilBrowserLogAfter(
            () => {
              editFile(file, (code) => code.replace(/([abc])0/g, '$11'))
            },
            HOT_UPDATED,
            (logs) => {
              expect(logs).toEqual([
                'all >>>>>> a1, b1, c1',
                `[vite] hot updated: ${url}`,
              ])
            },
          )

          await untilBrowserLogAfter(
            () => {
              editFile(file, (code) => code.replace(/([abc])1/g, '$12'))
            },
            HOT_UPDATED,
            (logs) => {
              expect(logs).toEqual([
                'all >>>>>> a2, b2, c2',
                `[vite] hot updated: ${url}`,
              ])
            },
          )
        })

        it("doesn't accept itself if one export is not accepted", async () => {
          const fileName = 'deps-some-accepted.ts'
          const file = `${testDir}/${fileName}`

          await untilBrowserLogAfter(
            () => page.goto(`${viteTestUrl}/${testDir}/`),
            '>>> ready <<<',
            (logs) => {
              expect(logs).toContain('loaded:some:a0b0c0default0')
              expect(logs).toContain('some >>>>>> a0, b0, c0')
            },
          )

          await untilBrowserLogAfter(
            async () => {
              editFile(file, (code) => code.replace(/([abc])0/g, '$11'))
              await page.waitForEvent('load')
            },
            '>>> ready <<<',
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

  test('css in html hmr', async () => {
    await page.goto(viteTestUrl)
    expect(await getBg('.import-image')).toMatch('icon')
    await page.goto(viteTestUrl + '/foo/', { waitUntil: 'load' })
    expect(await getBg('.import-image')).toMatch('icon')

    const loadPromise = page.waitForEvent('load')
    editFile('index.html', (code) => code.replace('url("./icon.png")', ''))
    await loadPromise
    expect(await getBg('.import-image')).toMatch('')
  })

  test('HTML', async () => {
    await page.goto(viteTestUrl + '/counter/index.html')
    let btn = await page.$('button')
    expect(await btn.textContent()).toBe('Counter 0')

    const loadPromise = page.waitForEvent('load')
    editFile('counter/index.html', (code) =>
      code.replace('Counter', 'Compteur'),
    )
    await loadPromise
    btn = await page.$('button')
    expect(await btn.textContent()).toBe('Compteur 0')
  })

  test('handle virtual module updates', async () => {
    await page.goto(viteTestUrl)
    const el = await page.$('.virtual')
    expect(await el.textContent()).toBe('[success]0')
    editFile('importedVirtual.js', (code) => code.replace('[success]', '[wow]'))
    await untilUpdated(async () => {
      const el = await page.$('.virtual')
      return await el.textContent()
    }, '[wow]')
  })

  test('invalidate virtual module', async () => {
    await page.goto(viteTestUrl)
    const el = await page.$('.virtual')
    expect(await el.textContent()).toBe('[wow]0')
    const btn = await page.$('.virtual-update')
    btn.click()
    await untilUpdated(async () => {
      const el = await page.$('.virtual')
      return await el.textContent()
    }, '[wow]1')
  })

  test('keep hmr reload after missing import on server startup', async () => {
    const file = 'missing-import/a.js'
    const importCode = "import 'missing-modules'"
    const unImportCode = `// ${importCode}`

    await page.goto(viteTestUrl + '/missing-import/index.html', {
      waitUntil: 'load',
    })

    await untilBrowserLogAfter(async () => {
      const loadPromise = page.waitForEvent('load')
      editFile(file, (code) => code.replace(importCode, unImportCode))
      await loadPromise
    }, 'missing test')

    await untilBrowserLogAfter(async () => {
      const loadPromise = page.waitForEvent('load')
      editFile(file, (code) => code.replace(unImportCode, importCode))
      await loadPromise
    }, /500/)
  })

  test('should hmr when file is deleted and restored', async () => {
    await page.goto(viteTestUrl)

    const parentFile = 'file-delete-restore/parent.js'
    const childFile = 'file-delete-restore/child.js'

    await untilUpdated(
      () => page.textContent('.file-delete-restore'),
      'parent:child',
    )

    editFile(childFile, (code) =>
      code.replace("value = 'child'", "value = 'child1'"),
    )
    await untilUpdated(
      () => page.textContent('.file-delete-restore'),
      'parent:child1',
    )

    editFile(parentFile, (code) =>
      code.replace(
        "export { value as childValue } from './child'",
        "export const childValue = 'not-child'",
      ),
    )
    removeFile(childFile)
    await untilUpdated(
      () => page.textContent('.file-delete-restore'),
      'parent:not-child',
    )

    addFile(
      childFile,
      `
import { rerender } from './runtime'

export const value = 'child'

if (import.meta.hot) {
  import.meta.hot.accept((newMod) => {
    if (!newMod) return

    rerender({ child: newMod.value })
  })
}
`,
    )
    editFile(parentFile, (code) =>
      code.replace(
        "export const childValue = 'not-child'",
        "export { value as childValue } from './child'",
      ),
    )
    await untilUpdated(
      () => page.textContent('.file-delete-restore'),
      'parent:child',
    )
  })

  test('import.meta.hot?.accept', async () => {
    const el = await page.$('.optional-chaining')
    await untilBrowserLogAfter(
      () =>
        editFile('optional-chaining/child.js', (code) =>
          code.replace('const foo = 1', 'const foo = 2'),
        ),
      '(optional-chaining) child update',
    )
    await untilUpdated(() => el.textContent(), '2')
  })

  test('hmr works for self-accepted module within circular imported files', async () => {
    await page.goto(viteTestUrl + '/self-accept-within-circular/index.html')
    const el = await page.$('.self-accept-within-circular')
    expect(await el.textContent()).toBe('c')
    editFile('self-accept-within-circular/c.js', (code) =>
      code.replace(`export const c = 'c'`, `export const c = 'cc'`),
    )
    await untilUpdated(() => el.textContent(), 'cc')
  })
}

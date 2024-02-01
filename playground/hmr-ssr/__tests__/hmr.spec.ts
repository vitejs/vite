import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, posix, resolve } from 'node:path'
import EventEmitter from 'node:events'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import type { InlineConfig, Logger, ViteDevServer } from 'vite'
import { createServer, createViteRuntime } from 'vite'
import type { ViteRuntime } from 'vite/runtime'
import type { RollupError } from 'rollup'
import { page, promiseWithResolvers, slash, untilUpdated } from '~utils'

let server: ViteDevServer
const clientLogs: string[] = []
const serverLogs: string[] = []
let runtime: ViteRuntime

const logsEmitter = new EventEmitter()

const originalFiles = new Map<string, string>()
const createdFiles = new Set<string>()
const deletedFiles = new Map<string, string>()
afterAll(async () => {
  await server.close()

  originalFiles.forEach((content, file) => {
    fs.writeFileSync(file, content, 'utf-8')
  })
  createdFiles.forEach((file) => {
    if (fs.existsSync(file)) fs.unlinkSync(file)
  })
  deletedFiles.forEach((file) => {
    fs.writeFileSync(file, deletedFiles.get(file)!, 'utf-8')
  })
  originalFiles.clear()
  createdFiles.clear()
  deletedFiles.clear()
})

const hmr = (key: string) => (globalThis.__HMR__[key] as string) || ''

const updated = (file: string, via?: string) => {
  if (via) {
    return `[vite] hot updated: ${file} via ${via}`
  }
  return `[vite] hot updated: ${file}`
}

describe('hmr works correctly', () => {
  beforeAll(async () => {
    await setupViteRuntime('/hmr.ts')
  })

  test('should connect', async () => {
    expect(clientLogs).toContain('[vite] connected.')
  })

  test('self accept', async () => {
    const el = () => hmr('.app')
    await untilConsoleLogAfter(
      () =>
        editFile('hmr.ts', (code) =>
          code.replace('const foo = 1', 'const foo = 2'),
        ),
      [
        '>>> vite:beforeUpdate -- update',
        'foo was: 1',
        '(self-accepting 1) foo is now: 2',
        '(self-accepting 2) foo is now: 2',
        updated('/hmr.ts'),
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await untilUpdated(() => el(), '2')

    await untilConsoleLogAfter(
      () =>
        editFile('hmr.ts', (code) =>
          code.replace('const foo = 2', 'const foo = 3'),
        ),
      [
        '>>> vite:beforeUpdate -- update',
        'foo was: 2',
        '(self-accepting 1) foo is now: 3',
        '(self-accepting 2) foo is now: 3',
        updated('/hmr.ts'),
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await untilUpdated(() => el(), '3')
  })

  test('accept dep', async () => {
    const el = () => hmr('.dep')
    await untilConsoleLogAfter(
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
        updated('/hmrDep.js', '/hmr.ts'),
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await untilUpdated(() => el(), '2')

    await untilConsoleLogAfter(
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
        updated('/hmrDep.js', '/hmr.ts'),
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await untilUpdated(() => el(), '3')
  })

  test('nested dep propagation', async () => {
    const el = () => hmr('.nested')
    await untilConsoleLogAfter(
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
        updated('/hmrDep.js', '/hmr.ts'),
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await untilUpdated(() => el(), '2')

    await untilConsoleLogAfter(
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
        updated('/hmrDep.js', '/hmr.ts'),
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await untilUpdated(() => el(), '3')
  })

  test('invalidate', async () => {
    const el = () => hmr('.invalidation')
    await untilConsoleLogAfter(
      () =>
        editFile('invalidation/child.js', (code) =>
          code.replace('child', 'child updated'),
        ),
      [
        '>>> vite:beforeUpdate -- update',
        `>>> vite:invalidate -- /invalidation/child.js`,
        '[vite] invalidate /invalidation/child.js',
        updated('/invalidation/child.js'),
        '>>> vite:afterUpdate -- update',
        '>>> vite:beforeUpdate -- update',
        '(invalidation) parent is executing',
        updated('/invalidation/parent.js'),
        '>>> vite:afterUpdate -- update',
      ],
      true,
    )
    await untilUpdated(() => el(), 'child updated')
  })

  test('soft invalidate', async () => {
    const el = () => hmr('.soft-invalidation')
    expect(el()).toBe(
      'soft-invalidation/index.js is transformed 1 times. child is bar',
    )
    editFile('soft-invalidation/child.js', (code) =>
      code.replace('bar', 'updated'),
    )
    await untilUpdated(
      () => el(),
      'soft-invalidation/index.js is transformed 1 times. child is updated',
    )
  })

  test('plugin hmr handler + custom event', async () => {
    const el = () => hmr('.custom')
    editFile('customFile.js', (code) => code.replace('custom', 'edited'))
    await untilUpdated(() => el(), 'edited')
  })

  test('plugin hmr remove custom events', async () => {
    const el = () => hmr('.toRemove')
    editFile('customFile.js', (code) => code.replace('custom', 'edited'))
    await untilUpdated(() => el(), 'edited')
    editFile('customFile.js', (code) => code.replace('edited', 'custom'))
    await untilUpdated(() => el(), 'edited')
  })

  test('plugin client-server communication', async () => {
    const el = () => hmr('.custom-communication')
    await untilUpdated(() => el(), '3')
  })

  test('queries are correctly resolved', async () => {
    const query1 = () => hmr('query1')
    const query2 = () => hmr('query2')

    expect(query1()).toBe('query1')
    expect(query2()).toBe('query2')

    editFile('queries/multi-query.js', (code) => code + '//comment')
    await untilUpdated(() => query1(), '//commentquery1')
    await untilUpdated(() => query2(), '//commentquery2')
  })

  // TODO
  // test.skipIf(hasWindowsUnicodeFsBug)('full-reload encodeURI path', async () => {
  //   await page.goto(
  //     viteTestUrl + '/unicode-path/中文-にほんご-한글-🌕🌖🌗/index.html',
  //   )
  //   const el = () => hmr('#app')
  //   expect(await el()).toBe('title')
  //   editFile('unicode-path/中文-にほんご-한글-🌕🌖🌗/index.html', (code) =>
  //     code.replace('title', 'title2'),
  //   )
  //   await page.waitForEvent('load')
  //   await untilUpdated(async () => el(), 'title2')
  // })

  // TODO: css is not supported in SSR (yet?)
  // test('CSS update preserves query params', async () => {
  //   await page.goto(viteTestUrl)

  //   editFile('global.css', (code) => code.replace('white', 'tomato'))

  //   const elprev = () => hmr('.css-prev')
  //   const elpost = () => hmr('.css-post')
  //   await untilUpdated(() => elprev(), 'param=required')
  //   await untilUpdated(() => elpost(), 'param=required')
  //   const textprev = elprev()
  //   const textpost = elpost()
  //   expect(textprev).not.toBe(textpost)
  //   expect(textprev).not.toMatch('direct')
  //   expect(textpost).not.toMatch('direct')
  // })

  // test('it swaps out link tags', async () => {
  //   await page.goto(viteTestUrl)

  //   editFile('global.css', (code) => code.replace('white', 'tomato'))

  //   let el = () => hmr('.link-tag-added')
  //   await untilUpdated(() => el(), 'yes')

  //   el = () => hmr('.link-tag-removed')
  //   await untilUpdated(() => el(), 'yes')

  //   expect((await page.$$('link')).length).toBe(1)
  // })

  // #2255
  test('importing reloaded', async () => {
    const outputEle = () => hmr('.importing-reloaded')

    await untilUpdated(outputEle, ['a.js: a0', 'b.js: b0,a0'].join('<br>'))

    editFile('importing-updated/a.js', (code) => code.replace("'a0'", "'a1'"))
    await untilUpdated(
      outputEle,
      ['a.js: a0', 'b.js: b0,a0', 'a.js: a1'].join('<br>'),
    )

    editFile('importing-updated/b.js', (code) =>
      code.replace('`b0,${a}`', '`b1,${a}`'),
    )
    // note that "a.js: a1" should not happen twice after "b.js: b0,a0'"
    await untilUpdated(
      outputEle,
      ['a.js: a0', 'b.js: b0,a0', 'a.js: a1', 'b.js: b1,a1'].join('<br>'),
    )
  })
})

describe('acceptExports', () => {
  const HOT_UPDATED = /hot updated/
  const CONNECTED = /connected/
  const PROGRAM_RELOAD = /program reload/

  const baseDir = 'accept-exports'

  describe('when all used exports are accepted', () => {
    const testDir = baseDir + '/main-accepted'

    const fileName = 'target.ts'
    const file = `${testDir}/${fileName}`
    const url = `/${file}`

    let dep = 'dep0'

    beforeAll(async () => {
      await untilConsoleLogAfter(
        () => setupViteRuntime(`/${testDir}/index`),
        [CONNECTED, />>>>>>/],
        (logs) => {
          expect(logs).toContain(`<<<<<< A0 B0 D0 ; ${dep}`)
          expect(logs).toContain('>>>>>> A0 D0')
        },
      )
    })

    test('the callback is called with the new version the module', async () => {
      const callbackFile = `${testDir}/callback.ts`
      const callbackUrl = `/${callbackFile}`

      await untilConsoleLogAfter(
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

      await untilConsoleLogAfter(
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

    test('stops HMR bubble on dependency change', async () => {
      const depFileName = 'dep.ts'
      const depFile = `${testDir}/${depFileName}`

      await untilConsoleLogAfter(
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

    test('accepts itself and refreshes on change', async () => {
      await untilConsoleLogAfter(
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

    test('accepts itself and refreshes on 2nd change', async () => {
      await untilConsoleLogAfter(
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

    test('does not accept itself anymore after acceptedExports change', async () => {
      await untilConsoleLogAfter(
        async () => {
          editFile(file, (code) => code.replace(/(\b[A-Z])2/g, '$13'))
        },
        [PROGRAM_RELOAD, />>>>>>/],
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
      await untilConsoleLogAfter(
        () => setupViteRuntime(`/${testDir}/index`),
        [CONNECTED, />>>>>>/],
        (logs) => {
          expect(logs).toContain(`<<< named: ${a} ; ${dep}`)
          expect(logs).toContain(`<<< default: def0`)
          expect(logs).toContain(`>>>>>> ${a} def0`)
        },
      )
    })

    test('does not stop the HMR bubble on change to dep', async () => {
      await untilConsoleLogAfter(
        async () => {
          editFile(depFile, (code) => code.replace('dep0', (dep = 'dep1')))
        },
        [PROGRAM_RELOAD, />>>>>>/],
        (logs) => {
          expect(logs).toContain(`<<< named: ${a} ; ${dep}`)
        },
      )
    })

    describe('does not stop the HMR bubble on change to self', () => {
      test('with named exports', async () => {
        await untilConsoleLogAfter(
          async () => {
            editFile(namedFile, (code) => code.replace(a, 'A1'))
          },
          [PROGRAM_RELOAD, />>>>>>/],
          (logs) => {
            expect(logs).toContain(`<<< named: A1 ; ${dep}`)
          },
        )
      })

      test('with default export', async () => {
        await untilConsoleLogAfter(
          async () => {
            editFile(defaultFile, (code) => code.replace('def0', 'def1'))
          },
          [PROGRAM_RELOAD, />>>>>>/],
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

    await untilConsoleLogAfter(
      () => setupViteRuntime(`/${testDir}/index`),
      [CONNECTED, />>>/],
      (logs) => {
        expect(logs).toContain('>>> side FX')
      },
    )

    await untilConsoleLogAfter(
      () => {
        editFile(`${testDir}/${file}`, (code) =>
          code.replace('>>> side FX', '>>> side FX !!'),
        )
      },
      HOT_UPDATED,
      (logs) => {
        expect(logs).toEqual(['>>> side FX !!', updated(`/${testDir}/${file}`)])
      },
    )
  })

  describe('acceptExports([])', () => {
    const testDir = baseDir + '/unused-exports'

    test('accepts itself if no exports are imported', async () => {
      const fileName = 'unused.ts'
      const file = `${testDir}/${fileName}`
      const url = '/' + file

      await untilConsoleLogAfter(
        () => setupViteRuntime(`/${testDir}/index`),
        [CONNECTED, '-- unused --'],
        (logs) => {
          expect(logs).toContain('-- unused --')
        },
      )

      await untilConsoleLogAfter(
        () => {
          editFile(file, (code) => code.replace('-- unused --', '-> unused <-'))
        },
        HOT_UPDATED,
        (logs) => {
          expect(logs).toEqual(['-> unused <-', updated(url)])
        },
      )
    })

    test("doesn't accept itself if any of its exports is imported", async () => {
      const fileName = 'used.ts'
      const file = `${testDir}/${fileName}`

      await untilConsoleLogAfter(
        () => setupViteRuntime(`/${testDir}/index`),
        [CONNECTED, '-- used --', 'used:foo0'],
        (logs) => {
          expect(logs).toContain('-- used --')
          expect(logs).toContain('used:foo0')
        },
      )

      await untilConsoleLogAfter(
        async () => {
          editFile(file, (code) =>
            code.replace('foo0', 'foo1').replace('-- used --', '-> used <-'),
          )
        },
        [PROGRAM_RELOAD, /used:foo/],
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

      test('accepts itself if all its exports are accepted', async () => {
        const fileName = 'deps-all-accepted.ts'
        const file = `${testDir}/${fileName}`
        const url = '/' + file

        await untilConsoleLogAfter(
          () => setupViteRuntime(`/${testDir}/index`),
          [CONNECTED, '>>> ready <<<'],
          (logs) => {
            expect(logs).toContain('loaded:all:a0b0c0default0')
            expect(logs).toContain('all >>>>>> a0, b0, c0')
          },
        )

        await untilConsoleLogAfter(
          () => {
            editFile(file, (code) => code.replace(/([abc])0/g, '$11'))
          },
          HOT_UPDATED,
          (logs) => {
            expect(logs).toEqual(['all >>>>>> a1, b1, c1', updated(url)])
          },
        )

        await untilConsoleLogAfter(
          () => {
            editFile(file, (code) => code.replace(/([abc])1/g, '$12'))
          },
          HOT_UPDATED,
          (logs) => {
            expect(logs).toEqual(['all >>>>>> a2, b2, c2', updated(url)])
          },
        )
      })

      test("doesn't accept itself if one export is not accepted", async () => {
        const fileName = 'deps-some-accepted.ts'
        const file = `${testDir}/${fileName}`

        await untilConsoleLogAfter(
          () => setupViteRuntime(`/${testDir}/index`),
          [CONNECTED, '>>> ready <<<'],
          (logs) => {
            expect(logs).toContain('loaded:some:a0b0c0default0')
            expect(logs).toContain('some >>>>>> a0, b0, c0')
          },
        )

        await untilConsoleLogAfter(
          async () => {
            editFile(file, (code) => code.replace(/([abc])0/g, '$11'))
          },
          [PROGRAM_RELOAD, '>>> ready <<<'],
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

test('handle virtual module updates', async () => {
  await setupViteRuntime('/hmr.ts')
  const el = () => hmr('.virtual')
  expect(el()).toBe('[success]0')
  editFile('importedVirtual.js', (code) => code.replace('[success]', '[wow]'))
  await untilUpdated(el, '[wow]')
})

test('invalidate virtual module', async () => {
  await setupViteRuntime('/hmr.ts')
  const el = () => hmr('.virtual')
  expect(el()).toBe('[wow]0')
  globalThis.__HMR__['virtual:increment']()
  await untilUpdated(el, '[wow]1')
})

test.todo('should hmr when file is deleted and restored', async () => {
  await setupViteRuntime('/hmr.ts')

  const parentFile = 'file-delete-restore/parent.js'
  const childFile = 'file-delete-restore/child.js'

  await untilUpdated(() => hmr('.file-delete-restore'), 'parent:child')

  editFile(childFile, (code) =>
    code.replace("value = 'child'", "value = 'child1'"),
  )
  await untilUpdated(() => hmr('.file-delete-restore'), 'parent:child1')

  editFile(parentFile, (code) =>
    code.replace(
      "export { value as childValue } from './child'",
      "export const childValue = 'not-child'",
    ),
  )
  removeFile(childFile)
  await untilUpdated(() => hmr('.file-delete-restore'), 'parent:not-child')

  createFile(
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
  await untilUpdated(() => hmr('.file-delete-restore'), 'parent:child')
})

test.todo('delete file should not break hmr', async () => {
  // await page.goto(viteTestUrl)

  await untilUpdated(
    () => page.textContent('.intermediate-file-delete-display'),
    'count is 1',
  )

  // add state
  await page.click('.intermediate-file-delete-increment')
  await untilUpdated(
    () => page.textContent('.intermediate-file-delete-display'),
    'count is 2',
  )

  // update import, hmr works
  editFile('intermediate-file-delete/index.js', (code) =>
    code.replace("from './re-export.js'", "from './display.js'"),
  )
  editFile('intermediate-file-delete/display.js', (code) =>
    code.replace('count is ${count}', 'count is ${count}!'),
  )
  await untilUpdated(
    () => page.textContent('.intermediate-file-delete-display'),
    'count is 2!',
  )

  // remove unused file, page reload because it's considered entry point now
  removeFile('intermediate-file-delete/re-export.js')
  await untilUpdated(
    () => page.textContent('.intermediate-file-delete-display'),
    'count is 1!',
  )

  // re-add state
  await page.click('.intermediate-file-delete-increment')
  await untilUpdated(
    () => page.textContent('.intermediate-file-delete-display'),
    'count is 2!',
  )

  // hmr works after file deletion
  editFile('intermediate-file-delete/display.js', (code) =>
    code.replace('count is ${count}!', 'count is ${count}'),
  )
  await untilUpdated(
    () => page.textContent('.intermediate-file-delete-display'),
    'count is 2',
  )
})

test('import.meta.hot?.accept', async () => {
  await setupViteRuntime('/hmr.ts')
  await untilConsoleLogAfter(
    () =>
      editFile('optional-chaining/child.js', (code) =>
        code.replace('const foo = 1', 'const foo = 2'),
      ),
    '(optional-chaining) child update',
  )
  await untilUpdated(() => hmr('.optional-chaining')?.toString(), '2')
})

test('hmr works for self-accepted module within circular imported files', async () => {
  await setupViteRuntime('/self-accept-within-circular/index')
  const el = () => hmr('.self-accept-within-circular')
  expect(el()).toBe('c')
  editFile('self-accept-within-circular/c.js', (code) =>
    code.replace(`export const c = 'c'`, `export const c = 'cc'`),
  )
  await untilUpdated(() => el(), 'cc')
  await vi.waitFor(() => {
    expect(serverLogs.length).greaterThanOrEqual(1)
    // Should still keep hmr update, but it'll error on the browser-side and will refresh itself.
    // Match on full log not possible because of color markers
    expect(serverLogs.at(-1)!).toContain('hmr update')
  })
})

test('hmr should not reload if no accepted within circular imported files', async () => {
  await setupViteRuntime('/circular/index')
  const el = () => hmr('.circular')
  expect(el()).toBe(
    // tests in the browser check that there is an error, but vite runtime just returns undefined in those cases
    'mod-a -> mod-b -> mod-c -> undefined (expected no error)',
  )
  editFile('circular/mod-b.js', (code) =>
    code.replace(`mod-b ->`, `mod-b (edited) ->`),
  )
  await untilUpdated(
    () => el(),
    'mod-a -> mod-b (edited) -> mod-c -> undefined (expected no error)',
  )
})

test('assets HMR', async () => {
  await setupViteRuntime('/hmr.ts')
  const el = () => hmr('#logo')
  await untilConsoleLogAfter(
    () =>
      editFile('logo.svg', (code) =>
        code.replace('height="30px"', 'height="40px"'),
      ),
    /Logo updated/,
  )
  await vi.waitUntil(() => el().includes('logo.svg?t='))
})

export function createFile(file: string, content: string): void {
  const filepath = resolvePath(import.meta.url, '..', file)
  createdFiles.add(filepath)
  fs.mkdirSync(dirname(filepath), { recursive: true })
  fs.writeFileSync(filepath, content, 'utf-8')
}

export function removeFile(file: string): void {
  const filepath = resolvePath('..', file)
  deletedFiles.set(filepath, fs.readFileSync(filepath, 'utf-8'))
  fs.unlinkSync(filepath)
}

export function editFile(
  file: string,
  callback: (content: string) => string,
): void {
  const filepath = resolvePath('..', file)
  const content = fs.readFileSync(filepath, 'utf-8')
  if (!originalFiles.has(filepath)) originalFiles.set(filepath, content)
  fs.writeFileSync(filepath, callback(content), 'utf-8')
}

export function resolvePath(...segments: string[]): string {
  const filename = fileURLToPath(import.meta.url)
  return resolve(dirname(filename), ...segments).replace(/\\/g, '/')
}

type UntilBrowserLogAfterCallback = (logs: string[]) => PromiseLike<void> | void

export async function untilConsoleLogAfter(
  operation: () => any,
  target: string | RegExp | Array<string | RegExp>,
  expectOrder?: boolean,
  callback?: UntilBrowserLogAfterCallback,
): Promise<string[]>
export async function untilConsoleLogAfter(
  operation: () => any,
  target: string | RegExp | Array<string | RegExp>,
  callback?: UntilBrowserLogAfterCallback,
): Promise<string[]>
export async function untilConsoleLogAfter(
  operation: () => any,
  target: string | RegExp | Array<string | RegExp>,
  arg3?: boolean | UntilBrowserLogAfterCallback,
  arg4?: UntilBrowserLogAfterCallback,
): Promise<string[]> {
  const expectOrder = typeof arg3 === 'boolean' ? arg3 : false
  const callback = typeof arg3 === 'boolean' ? arg4 : arg3

  const promise = untilConsoleLog(target, expectOrder)
  await operation()
  const logs = await promise
  if (callback) {
    await callback(logs)
  }
  return logs
}

async function untilConsoleLog(
  target?: string | RegExp | Array<string | RegExp>,
  expectOrder = true,
): Promise<string[]> {
  const { promise, resolve, reject } = promiseWithResolvers<void>()

  const logsMessages = []

  try {
    const isMatch = (matcher: string | RegExp) => (text: string) =>
      typeof matcher === 'string' ? text === matcher : matcher.test(text)

    let processMsg: (text: string) => boolean

    if (!target) {
      processMsg = () => true
    } else if (Array.isArray(target)) {
      if (expectOrder) {
        const remainingTargets = [...target]
        processMsg = (text: string) => {
          const nextTarget = remainingTargets.shift()
          expect(text).toMatch(nextTarget)
          return remainingTargets.length === 0
        }
      } else {
        const remainingMatchers = target.map(isMatch)
        processMsg = (text: string) => {
          const nextIndex = remainingMatchers.findIndex((matcher) =>
            matcher(text),
          )
          if (nextIndex >= 0) {
            remainingMatchers.splice(nextIndex, 1)
          }
          return remainingMatchers.length === 0
        }
      }
    } else {
      processMsg = isMatch(target)
    }

    const handleMsg = (text: string) => {
      try {
        text = text.replace(/\n$/, '')
        logsMessages.push(text)
        const done = processMsg(text)
        if (done) {
          resolve()
          logsEmitter.off('log', handleMsg)
        }
      } catch (err) {
        reject(err)
        logsEmitter.off('log', handleMsg)
      }
    }

    logsEmitter.on('log', handleMsg)
  } catch (err) {
    reject(err)
  }

  await promise

  return logsMessages
}

function isWatched(server: ViteDevServer, watchedFile: string) {
  const watched = server.watcher.getWatched()
  for (const [dir, files] of Object.entries(watched)) {
    const unixDir = slash(dir)
    for (const file of files) {
      const filePath = posix.join(unixDir, file)
      if (filePath.includes(watchedFile)) {
        return true
      }
    }
  }
  return false
}

function waitForWatcher(server: ViteDevServer, watched: string) {
  return new Promise<void>((resolve) => {
    function checkWatched() {
      if (isWatched(server, watched)) {
        resolve()
      } else {
        setTimeout(checkWatched, 20)
      }
    }
    checkWatched()
  })
}

function createInMemoryLogger(logs: string[]) {
  const loggedErrors = new WeakSet<Error | RollupError>()
  const warnedMessages = new Set<string>()

  const logger: Logger = {
    hasWarned: false,
    hasErrorLogged: (err) => loggedErrors.has(err),
    clearScreen: () => {},
    info(msg) {
      logs.push(msg)
    },
    warn(msg) {
      logs.push(msg)
      logger.hasWarned = true
    },
    warnOnce(msg) {
      if (warnedMessages.has(msg)) return
      logs.push(msg)
      logger.hasWarned = true
      warnedMessages.add(msg)
    },
    error(msg, opts) {
      logs.push(msg)
      if (opts?.error) {
        loggedErrors.add(opts.error)
      }
    },
  }

  return logger
}

async function setupViteRuntime(
  entrypoint: string,
  serverOptions: InlineConfig = {},
) {
  if (server) {
    await server.close()
    clientLogs.length = 0
    serverLogs.length = 0
    runtime.clearCache()
  }

  globalThis.__HMR__ = {} as any

  const root = resolvePath('..')
  server = await createServer({
    configFile: resolvePath('../vite.config.ts'),
    root,
    customLogger: createInMemoryLogger(serverLogs),
    server: {
      middlewareMode: true,
      watch: {
        // During tests we edit the files too fast and sometimes chokidar
        // misses change events, so enforce polling for consistency
        usePolling: true,
        interval: 100,
      },
      hmr: {
        port: 9609,
      },
      preTransformRequests: false,
    },
    optimizeDeps: {
      disabled: true,
      noDiscovery: true,
      include: [],
    },
    ...serverOptions,
  })

  const logger = new HMRMockLogger()
  // @ts-expect-error not typed for HMR
  globalThis.log = (...msg) => logger.debug(...msg)

  runtime = await createViteRuntime(server, {
    hmr: {
      logger,
    },
  })

  await waitForWatcher(server, entrypoint)

  await runtime.executeEntrypoint(entrypoint)

  return {
    runtime,
    server,
  }
}

class HMRMockLogger {
  debug(...msg: unknown[]) {
    const log = msg.join(' ')
    clientLogs.push(log)
    logsEmitter.emit('log', log)
  }
  error(msg: string) {
    clientLogs.push(msg)
    logsEmitter.emit('log', msg)
  }
}

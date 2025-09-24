import fs from 'node:fs'
import { posix, resolve } from 'node:path'
import EventEmitter from 'node:events'
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  onTestFinished,
  test,
  vi,
} from 'vitest'
import type { InlineConfig, RunnableDevEnvironment, ViteDevServer } from 'vite'
import { createRunnableDevEnvironment, createServer } from 'vite'
import type { ModuleRunner } from 'vite/module-runner'
import {
  addFile,
  createInMemoryLogger,
  editFile,
  isBuild,
  promiseWithResolvers,
  readFile,
  removeFile,
  slash,
  testDir,
} from '~utils'

let server: ViteDevServer
const clientLogs: string[] = []
const serverLogs: string[] = []
let runner: ModuleRunner

const logsEmitter = new EventEmitter()

afterAll(async () => {
  await server?.close()
})

const hmr = (key: string) => (globalThis.__HMR__[key] as string) || ''

const updated = (file: string, via?: string) => {
  if (via) {
    return `[vite] hot updated: ${file} via ${via}`
  }
  return `[vite] hot updated: ${file}`
}

if (!isBuild) {
  describe('hmr works correctly', () => {
    beforeAll(async () => {
      await setupModuleRunner('/hmr.ts')
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
      await expect.poll(() => el()).toMatch('2')

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
      await expect.poll(() => el()).toMatch('3')
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
      await expect.poll(() => el()).toMatch('2')

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
      await expect.poll(() => el()).toMatch('3')
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
      await expect.poll(() => el()).toMatch('2')

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
      await expect.poll(() => el()).toMatch('3')
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
      await expect.poll(() => el()).toMatch('child updated')
    })

    test('soft invalidate', async () => {
      const el = () => hmr('.soft-invalidation')
      expect(el()).toBe(
        'soft-invalidation/index.js is transformed 1 times. child is bar',
      )
      editFile('soft-invalidation/child.js', (code) =>
        code.replace('bar', 'updated'),
      )
      await expect
        .poll(() => el())
        .toBe(
          'soft-invalidation/index.js is transformed 1 times. child is updated',
        )
    })

    test('invalidate in circular dep should not trigger infinite HMR', async () => {
      const el = () => hmr('.invalidation-circular-deps')
      await expect.poll(() => el()).toMatch('child')
      editFile(
        'invalidation-circular-deps/circular-invalidate/child.js',
        (code) => code.replace('child', 'child updated'),
      )
      await expect.poll(() => el()).toMatch('child updated')
    })

    test('invalidate in circular dep should be hot updated if possible', async () => {
      const el = () => hmr('.invalidation-circular-deps-handled')
      await expect.poll(() => el()).toMatch('child')
      editFile(
        'invalidation-circular-deps/invalidate-handled-in-circle/child.js',
        (code) => code.replace('child', 'child updated'),
      )
      await expect.poll(() => el()).toMatch('child updated')
    })

    test('plugin hmr handler + custom event', async () => {
      const el = () => hmr('.custom')
      editFile('customFile.js', (code) => code.replace('custom', 'edited'))
      await expect.poll(() => el()).toMatch('edited')
    })

    test('plugin hmr remove custom events', async () => {
      const el = () => hmr('.toRemove')
      editFile('customFile.js', (code) => code.replace('custom', 'edited'))
      await expect.poll(() => el()).toMatch('edited')
      editFile('customFile.js', (code) => code.replace('edited', 'custom'))
      await expect.poll(() => el()).toMatch('edited')
    })

    test('plugin client-server communication', async () => {
      const el = () => hmr('.custom-communication')
      await expect.poll(() => el()).toMatch('3')
    })

    test('queries are correctly resolved', async () => {
      const query1 = () => hmr('query1')
      const query2 = () => hmr('query2')

      expect(query1()).toBe('query1')
      expect(query2()).toBe('query2')

      editFile('queries/multi-query.js', (code) => code + '//comment')
      await expect.poll(() => query1()).toBe('//commentquery1')
      await expect.poll(() => query2()).toBe('//commentquery2')
    })
  })

  describe('self accept with different entry point formats', () => {
    test.each(['./unresolved.ts', './unresolved', '/unresolved'])(
      'accepts if entry point is relative to root %s',
      async (entrypoint) => {
        await setupModuleRunner(entrypoint, {}, '/unresolved.ts')

        const originalUnresolvedFile = readFile('unresolved.ts')
        onTestFinished(() => {
          const filepath = resolve(testDir, 'unresolved.ts')
          fs.writeFileSync(filepath, originalUnresolvedFile, 'utf-8')
        })

        const el = () => hmr('.app')
        await untilConsoleLogAfter(
          () =>
            editFile('unresolved.ts', (code) =>
              code.replace('const foo = 1', 'const foo = 2'),
            ),
          [
            'foo was: 1',
            '(self-accepting 1) foo is now: 2',
            '(self-accepting 2) foo is now: 2',
            updated(entrypoint),
          ],
          true,
        )
        await expect.poll(() => el()).toMatch('2')

        await untilConsoleLogAfter(
          () =>
            editFile('unresolved.ts', (code) =>
              code.replace('const foo = 2', 'const foo = 3'),
            ),
          [
            'foo was: 2',
            '(self-accepting 1) foo is now: 3',
            '(self-accepting 2) foo is now: 3',
            updated(entrypoint),
          ],
          true,
        )
        await expect.poll(() => el()).toMatch('3')
      },
    )
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
          () => setupModuleRunner(`/${testDir}/index`),
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
          () => setupModuleRunner(`/${testDir}/index`),
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

      describe("doesn't reload if files not in the entrypoint importers chain is changed", async () => {
        const testFile = 'non-tested/index.js'

        beforeAll(async () => {
          clientLogs.length = 0
          // so it's in the module graph
          const ssrEnvironment = server.environments.ssr
          await ssrEnvironment.transformRequest(testFile)
          await ssrEnvironment.transformRequest('non-tested/dep.js')
        })

        test('does not full reload', async () => {
          editFile(
            testFile,
            (code) => code + '\n\nexport const query5 = "query5"',
          )
          const start = Date.now()
          // for 2 seconds check that there is no log about the file being reloaded
          while (Date.now() - start < 2000) {
            if (
              clientLogs.some(
                (log) =>
                  log.match(PROGRAM_RELOAD) ||
                  log.includes('non-tested/index.js'),
              )
            ) {
              throw new Error('File was reloaded')
            }
            await new Promise((r) => setTimeout(r, 100))
          }
        }, 5_000)

        test('does not update', async () => {
          editFile('non-tested/dep.js', (code) => code + '//comment')
          const start = Date.now()
          // for 2 seconds check that there is no log about the file being reloaded
          while (Date.now() - start < 2000) {
            if (
              clientLogs.some(
                (log) =>
                  log.match(PROGRAM_RELOAD) ||
                  log.includes('non-tested/dep.js'),
              )
            ) {
              throw new Error('File was updated')
            }
            await new Promise((r) => setTimeout(r, 100))
          }
        }, 5_000)
      })
    })

    test('accepts itself when imported for side effects only (no bindings imported)', async () => {
      const testDir = baseDir + '/side-effects'
      const file = 'side-effects.ts'

      await untilConsoleLogAfter(
        () => setupModuleRunner(`/${testDir}/index`),
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
          expect(logs).toEqual([
            '>>> side FX !!',
            updated(`/${testDir}/${file}`),
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

        await untilConsoleLogAfter(
          () => setupModuleRunner(`/${testDir}/index`),
          [CONNECTED, '-- unused --'],
          (logs) => {
            expect(logs).toContain('-- unused --')
          },
        )

        await untilConsoleLogAfter(
          () => {
            editFile(file, (code) =>
              code.replace('-- unused --', '-> unused <-'),
            )
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
          () => setupModuleRunner(`/${testDir}/index`),
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
            () => setupModuleRunner(`/${testDir}/index`),
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
            () => setupModuleRunner(`/${testDir}/index`),
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
    await setupModuleRunner('/hmr.ts')
    const el = () => hmr('.virtual')
    expect(el()).toBe('[success]0')
    editFile('importedVirtual.js', (code) => code.replace('[success]', '[wow]'))
    await expect.poll(el).toBe('[wow]0')
  })

  test('invalidate virtual module', async () => {
    await setupModuleRunner('/hmr.ts')
    const el = () => hmr('.virtual')
    expect(el()).toBe('[wow]0')
    globalThis.__HMR__['virtual:increment']()
    await expect.poll(el).toBe('[wow]1')
  })

  test('should hmr when file is deleted and restored', async () => {
    await setupModuleRunner('/hmr.ts')

    const parentFile = 'file-delete-restore/parent.js'
    const childFile = 'file-delete-restore/child.js'

    await expect.poll(() => hmr('.file-delete-restore')).toMatch('parent:child')

    editFile(childFile, (code) =>
      code.replace("value = 'child'", "value = 'child1'"),
    )
    await expect
      .poll(() => hmr('.file-delete-restore'))
      .toMatch('parent:child1')

    // delete the file
    editFile(parentFile, (code) =>
      code.replace(
        "export { value as childValue } from './child'",
        "export const childValue = 'not-child'",
      ),
    )
    const originalChildFileCode = readFile(childFile)
    removeFile(childFile)
    await expect
      .poll(() => hmr('.file-delete-restore'))
      .toMatch('parent:not-child')

    // restore the file
    addFile(childFile, originalChildFileCode)
    editFile(parentFile, (code) =>
      code.replace(
        "export const childValue = 'not-child'",
        "export { value as childValue } from './child'",
      ),
    )
    await expect.poll(() => hmr('.file-delete-restore')).toMatch('parent:child')
  })

  test('delete file should not break hmr', async () => {
    await setupModuleRunner('/hmr.ts', undefined, undefined, {
      '.intermediate-file-delete-increment': '1',
    })

    await expect
      .poll(() => hmr('.intermediate-file-delete-display'))
      .toMatch('count is 1')

    // add state
    globalThis.__HMR__['.delete-intermediate-file']()
    await expect
      .poll(() => hmr('.intermediate-file-delete-display'))
      .toMatch('count is 2')

    // update import, hmr works
    editFile('intermediate-file-delete/index.js', (code) =>
      code.replace("from './re-export.js'", "from './display.js'"),
    )
    editFile('intermediate-file-delete/display.js', (code) =>
      code.replace('count is ${count}', 'count is ${count}!'),
    )
    await expect
      .poll(() => hmr('.intermediate-file-delete-display'))
      .toMatch('count is 2!')

    // remove unused file
    removeFile('intermediate-file-delete/re-export.js')
    __HMR__['.intermediate-file-delete-increment'] = '1' // reset state
    await expect
      .poll(() => hmr('.intermediate-file-delete-display'))
      .toMatch('count is 1!')

    // re-add state
    globalThis.__HMR__['.delete-intermediate-file']()
    await expect
      .poll(() => hmr('.intermediate-file-delete-display'))
      .toMatch('count is 2!')

    // hmr works after file deletion
    editFile('intermediate-file-delete/display.js', (code) =>
      code.replace('count is ${count}!', 'count is ${count}'),
    )
    await expect
      .poll(() => hmr('.intermediate-file-delete-display'))
      .toMatch('count is 2')
  })

  test('deleted file should trigger dispose and prune callbacks', async () => {
    await setupModuleRunner('/hmr.ts')

    const parentFile = 'file-delete-restore/parent.js'
    const childFile = 'file-delete-restore/child.js'
    const originalChildFileCode = readFile(childFile)

    await untilConsoleLogAfter(
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
      .poll(() => hmr('.file-delete-restore'))
      .toMatch('parent:not-child')

    // restore the file
    addFile(childFile, originalChildFileCode)
    editFile(parentFile, (code) =>
      code.replace(
        "export const childValue = 'not-child'",
        "export { value as childValue } from './child'",
      ),
    )
    await expect.poll(() => hmr('.file-delete-restore')).toMatch('parent:child')
  })

  test('import.meta.hot?.accept', async () => {
    await setupModuleRunner('/hmr.ts')
    await untilConsoleLogAfter(
      () =>
        editFile('optional-chaining/child.js', (code) =>
          code.replace('const foo = 1', 'const foo = 2'),
        ),
      '(optional-chaining) child update',
    )
    await expect.poll(() => hmr('.optional-chaining')?.toString()).toMatch('2')
  })

  test('hmr works for self-accepted module within circular imported files', async () => {
    await setupModuleRunner('/self-accept-within-circular/index')
    const el = () => hmr('.self-accept-within-circular')
    expect(el()).toBe('c')
    editFile('self-accept-within-circular/c.js', (code) =>
      code.replace(`export const c = 'c'`, `export const c = 'cc'`),
    )
    // it throws a same error as browser case,
    // but it doesn't auto reload and it calls `hot.accept(nextExports)` with `nextExports = undefined`

    // test reloading manually for now
    server.moduleGraph.invalidateAll() // TODO: why is `runner.clearCache()` not enough?
    await runner.import('/self-accept-within-circular/index')
    await expect.poll(() => el()).toBe('cc')
  })

  test('hmr should not reload if no accepted within circular imported files', async () => {
    await setupModuleRunner('/circular/index')
    const el = () => hmr('.circular')
    expect(el()).toBe(
      // tests in the browser check that there is an error, but vite runtime just returns undefined in those cases
      'mod-a -> mod-b -> mod-c -> undefined (expected no error)',
    )
    editFile('circular/mod-b.js', (code) =>
      code.replace(`mod-b ->`, `mod-b (edited) ->`),
    )
    await expect
      .poll(() => el())
      .toBe('mod-a -> mod-b (edited) -> mod-c -> undefined (expected no error)')
  })

  test('not inlined assets HMR', async () => {
    await setupModuleRunner('/hmr.ts')
    const el = () => hmr('#logo-no-inline')
    await untilConsoleLogAfter(
      () =>
        editFile('logo-no-inline.svg', (code) =>
          code.replace('height="30px"', 'height="40px"'),
        ),
      /Logo-no-inline updated/,
    )
    await vi.waitUntil(() => el().includes('logo-no-inline.svg?t='))
  })

  test('inlined assets HMR', async () => {
    await setupModuleRunner('/hmr.ts')
    const el = () => hmr('#logo')
    const initialLogoUrl = el()
    expect(initialLogoUrl).toMatch(/^data:image\/svg\+xml/)
    await untilConsoleLogAfter(
      () =>
        editFile('logo.svg', (code) =>
          code.replace('height="30px"', 'height="40px"'),
        ),
      /Logo updated/,
    )
    // Should be updated with new data url
    const updatedLogoUrl = el()
    expect(updatedLogoUrl).toMatch(/^data:image\/svg\+xml/)
    expect(updatedLogoUrl).not.toEqual(initialLogoUrl)
  })
} else {
  test('this file only includes test for serve', () => {
    expect(true).toBe(true)
  })
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

async function setupModuleRunner(
  entrypoint: string,
  serverOptions: InlineConfig = {},
  waitForFile: string = entrypoint,
  initHmrState: Record<string, string> = {},
) {
  if (server) {
    await server.close()
    clientLogs.length = 0
    serverLogs.length = 0
    runner.clearCache()
  }

  globalThis.__HMR__ = initHmrState as any

  const logger = new HMRMockLogger()
  // @ts-expect-error not typed for HMR
  globalThis.log = (...msg) => logger.log(...msg)

  server = await createServer({
    configFile: resolve(testDir, 'vite.config.ts'),
    root: testDir,
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
    environments: {
      ssr: {
        dev: {
          createEnvironment(name, config) {
            return createRunnableDevEnvironment(name, config, {
              runnerOptions: { hmr: { logger } },
            })
          },
        },
      },
    },
    optimizeDeps: {
      disabled: true,
      noDiscovery: true,
      include: [],
    },
    ...serverOptions,
  })

  runner = (server.environments.ssr as RunnableDevEnvironment).runner

  await waitForWatcher(server, waitForFile)

  await runner.import(entrypoint)

  return {
    runtime: runner,
    server,
  }
}

class HMRMockLogger {
  log(...msg: unknown[]) {
    const log = msg.join(' ')
    clientLogs.push(log)
    logsEmitter.emit('log', log)
  }

  debug(...msg: unknown[]) {
    const log = ['[vite]', ...msg].join(' ')
    clientLogs.push(log)
    logsEmitter.emit('log', log)
  }
  error(msg: string) {
    const log = ['[vite]', msg].join(' ')
    clientLogs.push(log)
    logsEmitter.emit('log', log)
  }
}

import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stripVTControlCharacters } from 'node:util'
import colors from 'picocolors'
import { afterEach, describe, expect, test, vi } from 'vitest'
import type {
  LogLevel,
  OutputChunk,
  OutputOptions,
  RollupLog,
  RollupOptions,
  RollupOutput,
} from 'rollup'
import type { LibraryFormats, LibraryOptions } from '../build'
import {
  build,
  createBuilder,
  onRollupLog,
  resolveBuildOutputs,
  resolveLibFilename,
} from '../build'
import type { Logger } from '../logger'
import { createLogger } from '../logger'
import { BuildEnvironment, resolveConfig } from '..'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')

type FormatsToFileNames = [LibraryFormats, string][]

describe('build', () => {
  test('file hash should change when css changes for dynamic entries', async () => {
    const buildProject = async (cssColor: string) => {
      return (await build({
        root: resolve(__dirname, 'packages/build-project'),
        logLevel: 'silent',
        build: {
          write: false,
        },
        plugins: [
          {
            name: 'test',
            resolveId(id) {
              if (
                id === 'entry.js' ||
                id === 'subentry.js' ||
                id === 'foo.css'
              ) {
                return '\0' + id
              }
            },
            load(id) {
              if (id === '\0entry.js') {
                return `window.addEventListener('click', () => { import('subentry.js') });`
              }
              if (id === '\0subentry.js') {
                return `import 'foo.css'`
              }
              if (id === '\0foo.css') {
                return `.foo { color: ${cssColor} }`
              }
            },
          },
        ],
      })) as RollupOutput
    }
    const result = await Promise.all([
      buildProject('red'),
      buildProject('blue'),
    ])
    expect(getOutputHashChanges(result[0], result[1])).toMatchInlineSnapshot(`
      {
        "changed": [
          "index",
          "_subentry.css",
        ],
        "unchanged": [
          "undefined",
        ],
      }
    `)
    assertOutputHashContentChange(result[0], result[1])
  })

  test('file hash should change when pure css chunk changes', async () => {
    const buildProject = async (cssColor: string) => {
      return (await build({
        root: resolve(__dirname, 'packages/build-project'),
        logLevel: 'silent',
        build: {
          write: false,
        },
        plugins: [
          {
            name: 'test',
            resolveId(id) {
              if (
                id === 'entry.js' ||
                id === 'foo.js' ||
                id === 'bar.js' ||
                id === 'baz.js' ||
                id === 'foo.css' ||
                id === 'bar.css' ||
                id === 'baz.css'
              ) {
                return '\0' + id
              }
            },
            load(id) {
              if (id === '\0entry.js') {
                return `
                  window.addEventListener('click', () => { import('foo.js') });
                  window.addEventListener('click', () => { import('bar.js') });`
              }
              if (id === '\0foo.js') return `import 'foo.css'; import 'baz.js'`
              if (id === '\0bar.js') return `import 'bar.css'; import 'baz.js'`
              if (id === '\0baz.js') return `import 'baz.css'`
              if (id === '\0foo.css') return `.foo { color: red }`
              if (id === '\0bar.css') return `.foo { color: green }`
              if (id === '\0baz.css') return `.foo { color: ${cssColor} }`
            },
          },
        ],
      })) as RollupOutput
    }
    const result = await Promise.all([
      buildProject('yellow'),
      buildProject('blue'),
    ])
    expect(getOutputHashChanges(result[0], result[1])).toMatchInlineSnapshot(`
      {
        "changed": [
          "index",
          "_foo",
          "_bar",
          "_baz.css",
        ],
        "unchanged": [
          "_foo.css",
          "_bar.css",
          "undefined",
        ],
      }
    `)
    assertOutputHashContentChange(result[0], result[1])
  })

  test.for([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
    ['auto', true],
    ['auto', false],
  ] as const)(
    'large json object files should have tree-shaking (json.stringify: %s, json.namedExports: %s)',
    async ([stringify, namedExports]) => {
      const esBundle = (await build({
        mode: 'development',
        root: resolve(__dirname, 'packages/build-project'),
        logLevel: 'silent',
        json: { stringify, namedExports },
        build: {
          minify: false,
          modulePreload: { polyfill: false },
          write: false,
        },
        plugins: [
          {
            name: 'test',
            resolveId(id) {
              if (
                id === 'entry.js' ||
                id === 'object.json' ||
                id === 'array.json'
              ) {
                return '\0' + id
              }
            },
            load(id) {
              if (id === '\0entry.js') {
                return `
                  import object from 'object.json';
                  import array from 'array.json';
                  console.log();
                `
              }
              if (id === '\0object.json') {
                return `
                  {"value": {"${stringify}_${namedExports}":"JSON_OBJ${'_'.repeat(10_000)}"}}
                `
              }
              if (id === '\0array.json') {
                return `
                  ["${stringify}_${namedExports}","JSON_ARR${'_'.repeat(10_000)}"]
                `
              }
            },
          },
        ],
      })) as RollupOutput

      const foo = esBundle.output.find(
        (chunk) => chunk.type === 'chunk' && chunk.isEntry,
      ) as OutputChunk
      expect(foo.code).not.contains('JSON_ARR')
      expect(foo.code).not.contains('JSON_OBJ')
    },
  )

  test('external modules should not be hoisted in library build', async () => {
    const [esBundle] = (await build({
      logLevel: 'silent',
      build: {
        lib: {
          entry: ['foo.js', 'bar.js'],
          formats: ['es'],
        },
        rollupOptions: {
          external: 'external',
        },
        write: false,
      },
      plugins: [
        {
          name: 'test',
          resolveId(id) {
            const name = basename(id)
            if (name === 'foo.js' || name === 'bar.js') {
              return name
            }
          },
          load(id) {
            if (id === 'foo.js') {
              return `
                  import bar from 'bar.js'
                  export default bar()
                `
            }
            if (id === 'bar.js') {
              return `
                  import ext from 'external';
                  export default ext();`
            }
          },
        },
      ],
    })) as RollupOutput[]

    const foo = esBundle.output.find(
      (chunk) => chunk.fileName === 'foo.js',
    ) as OutputChunk
    expect(foo.code).not.contains('import "external"')
  })
})

const baseLibOptions: LibraryOptions = {
  fileName: 'my-lib',
  entry: 'mylib.js',
}

describe('resolveBuildOutputs', () => {
  test('resolves outputs correctly', () => {
    const logger = createLogger()
    const libOptions: LibraryOptions = { ...baseLibOptions }
    const outputs: OutputOptions[] = [{ format: 'es' }]
    const resolvedOutputs = resolveBuildOutputs(outputs, libOptions, logger)

    expect(resolvedOutputs).toEqual([
      {
        format: 'es',
      },
    ])
  })

  test('resolves outputs from lib options', () => {
    const logger = createLogger()
    const libOptions: LibraryOptions = { ...baseLibOptions, name: 'lib' }
    const resolvedOutputs = resolveBuildOutputs(void 0, libOptions, logger)

    expect(resolvedOutputs).toEqual([
      {
        format: 'es',
      },
      {
        format: 'umd',
      },
    ])
  })

  test('does not change outputs when lib options are missing', () => {
    const logger = createLogger()
    const outputs: OutputOptions[] = [{ format: 'es' }]
    const resolvedOutputs = resolveBuildOutputs(outputs, false, logger)

    expect(resolvedOutputs).toEqual(outputs)
  })

  test('logs a warning when outputs is an array and formats are specified', () => {
    const logger = createLogger()
    const loggerSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const libOptions: LibraryOptions = {
      ...baseLibOptions,
      formats: ['iife'],
    }
    const outputs: OutputOptions[] = [{ format: 'es' }]

    resolveBuildOutputs(outputs, libOptions, logger)

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('"build.lib.formats" will be ignored because'),
    )
  })

  test('throws an error when lib.name is missing on iife format', () => {
    const logger = createLogger()
    const libOptions: LibraryOptions = {
      ...baseLibOptions,
      formats: ['iife'],
    }
    const resolveBuild = () => resolveBuildOutputs(void 0, libOptions, logger)

    expect(resolveBuild).toThrowError(/Option "build\.lib\.name" is required/)
  })

  test('throws an error when lib.name is missing on umd format', () => {
    const logger = createLogger()
    const libOptions: LibraryOptions = { ...baseLibOptions, formats: ['umd'] }
    const resolveBuild = () => resolveBuildOutputs(void 0, libOptions, logger)

    expect(resolveBuild).toThrowError(/Option "build\.lib\.name" is required/)
  })

  test('throws an error when output.name is missing on iife format', () => {
    const logger = createLogger()
    const libOptions: LibraryOptions = { ...baseLibOptions }
    const outputs: OutputOptions[] = [{ format: 'iife' }]
    const resolveBuild = () => resolveBuildOutputs(outputs, libOptions, logger)

    expect(resolveBuild).toThrowError(
      /Entries in "build\.rollupOptions\.output" must specify "name"/,
    )
  })

  test('throws an error when output.name is missing on umd format', () => {
    const logger = createLogger()
    const libOptions: LibraryOptions = { ...baseLibOptions }
    const outputs: OutputOptions[] = [{ format: 'umd' }]
    const resolveBuild = () => resolveBuildOutputs(outputs, libOptions, logger)

    expect(resolveBuild).toThrowError(
      /Entries in "build\.rollupOptions\.output" must specify "name"/,
    )
  })
})

describe('resolveLibFilename', () => {
  test('custom filename function', () => {
    const filename = resolveLibFilename(
      {
        fileName: (format) => `custom-filename-function.${format}.js`,
        entry: 'mylib.js',
      },
      'es',
      'myLib',
      resolve(__dirname, 'packages/name'),
    )

    expect(filename).toBe('custom-filename-function.es.js')
  })

  test('custom filename string', () => {
    const filename = resolveLibFilename(
      {
        fileName: 'custom-filename',
        entry: 'mylib.js',
      },
      'es',
      'myLib',
      resolve(__dirname, 'packages/name'),
    )

    expect(filename).toBe('custom-filename.mjs')
  })

  test('package name as filename', () => {
    const filename = resolveLibFilename(
      {
        entry: 'mylib.js',
      },
      'es',
      'myLib',
      resolve(__dirname, 'packages/name'),
    )

    expect(filename).toBe('mylib.mjs')
  })

  test('custom filename and no package name', () => {
    const filename = resolveLibFilename(
      {
        fileName: 'custom-filename',
        entry: 'mylib.js',
      },
      'es',
      'myLib',
      resolve(__dirname, 'packages/noname'),
    )

    expect(filename).toBe('custom-filename.mjs')
  })

  test('missing filename', () => {
    expect(() => {
      resolveLibFilename(
        {
          entry: 'mylib.js',
        },
        'es',
        'myLib',
        resolve(__dirname, 'packages/noname'),
      )
    }).toThrow()
  })

  test('commonjs package extensions', () => {
    const formatsToFilenames: FormatsToFileNames = [
      ['es', 'my-lib.mjs'],
      ['umd', 'my-lib.umd.js'],
      ['cjs', 'my-lib.js'],
      ['iife', 'my-lib.iife.js'],
    ]

    for (const [format, expectedFilename] of formatsToFilenames) {
      const filename = resolveLibFilename(
        baseLibOptions,
        format,
        'myLib',
        resolve(__dirname, 'packages/noname'),
      )

      expect(filename).toBe(expectedFilename)
    }
  })

  test('module package extensions', () => {
    const formatsToFilenames: FormatsToFileNames = [
      ['es', 'my-lib.js'],
      ['umd', 'my-lib.umd.cjs'],
      ['cjs', 'my-lib.cjs'],
      ['iife', 'my-lib.iife.js'],
    ]

    for (const [format, expectedFilename] of formatsToFilenames) {
      const filename = resolveLibFilename(
        baseLibOptions,
        format,
        'myLib',
        resolve(__dirname, 'packages/module'),
      )

      expect(expectedFilename).toBe(filename)
    }
  })

  test('multiple entries with aliases', () => {
    const libOptions: LibraryOptions = {
      entry: {
        entryA: 'entryA.js',
        entryB: 'entryB.js',
      },
    }

    const [fileName1, fileName2] = ['entryA', 'entryB'].map((entryAlias) =>
      resolveLibFilename(
        libOptions,
        'es',
        entryAlias,
        resolve(__dirname, 'packages/name'),
      ),
    )

    expect(fileName1).toBe('entryA.mjs')
    expect(fileName2).toBe('entryB.mjs')
  })

  test('multiple entries with aliases: custom filename function', () => {
    const libOptions: LibraryOptions = {
      entry: {
        entryA: 'entryA.js',
        entryB: 'entryB.js',
      },
      fileName: (format, entryAlias) =>
        `custom-filename-function.${entryAlias}.${format}.js`,
    }

    const [fileName1, fileName2] = ['entryA', 'entryB'].map((entryAlias) =>
      resolveLibFilename(
        libOptions,
        'es',
        entryAlias,
        resolve(__dirname, 'packages/name'),
      ),
    )

    expect(fileName1).toBe('custom-filename-function.entryA.es.js')
    expect(fileName2).toBe('custom-filename-function.entryB.es.js')
  })

  test('multiple entries with aliases: custom filename string', () => {
    const libOptions: LibraryOptions = {
      entry: {
        entryA: 'entryA.js',
        entryB: 'entryB.js',
      },
      fileName: 'custom-filename',
    }

    const [fileName1, fileName2] = ['entryA', 'entryB'].map((entryAlias) =>
      resolveLibFilename(
        libOptions,
        'es',
        entryAlias,
        resolve(__dirname, 'packages/name'),
      ),
    )

    expect(fileName1).toBe('custom-filename.mjs')
    expect(fileName2).toBe('custom-filename.mjs')
  })

  test('multiple entries as array', () => {
    const libOptions: LibraryOptions = {
      entry: ['entryA.js', 'entryB.js'],
    }

    const [fileName1, fileName2] = ['entryA', 'entryB'].map((entryAlias) =>
      resolveLibFilename(
        libOptions,
        'es',
        entryAlias,
        resolve(__dirname, 'packages/name'),
      ),
    )

    expect(fileName1).toBe('entryA.mjs')
    expect(fileName2).toBe('entryB.mjs')
  })

  test('multiple entries as array: custom filename function', () => {
    const libOptions: LibraryOptions = {
      entry: ['entryA.js', 'entryB.js'],
      fileName: (format, entryAlias) =>
        `custom-filename-function.${entryAlias}.${format}.js`,
    }

    const [fileName1, fileName2] = ['entryA', 'entryB'].map((entryAlias) =>
      resolveLibFilename(
        libOptions,
        'es',
        entryAlias,
        resolve(__dirname, 'packages/name'),
      ),
    )

    expect(fileName1).toBe('custom-filename-function.entryA.es.js')
    expect(fileName2).toBe('custom-filename-function.entryB.es.js')
  })

  test('multiple entries as array: custom filename string', () => {
    const libOptions: LibraryOptions = {
      entry: ['entryA.js', 'entryB.js'],
      fileName: 'custom-filename',
    }

    const [fileName1, fileName2] = ['entryA', 'entryB'].map((entryAlias) =>
      resolveLibFilename(
        libOptions,
        'es',
        entryAlias,
        resolve(__dirname, 'packages/name'),
      ),
    )

    expect(fileName1).toBe('custom-filename.mjs')
    expect(fileName2).toBe('custom-filename.mjs')
  })
})

describe('resolveBuildOutputs', () => {
  test('default format: one entry', () => {
    const libOptions: LibraryOptions = {
      entry: 'entryA.js',
      name: 'entryA',
    }

    expect(resolveBuildOutputs(undefined, libOptions, {} as Logger)).toEqual([
      { format: 'es' },
      { format: 'umd' },
    ])
    expect(
      resolveBuildOutputs({ name: 'A' }, libOptions, {} as Logger),
    ).toEqual([
      { format: 'es', name: 'A' },
      { format: 'umd', name: 'A' },
    ])
    expect(
      resolveBuildOutputs([{ name: 'A' }], libOptions, {} as Logger),
    ).toEqual([{ name: 'A' }])
  })

  test('default format: multiple entries', () => {
    const libOptions: LibraryOptions = {
      entry: ['entryA.js', 'entryB.js'],
    }

    expect(resolveBuildOutputs(undefined, libOptions, {} as Logger)).toEqual([
      { format: 'es' },
      { format: 'cjs' },
    ])
    expect(
      resolveBuildOutputs({ name: 'A' }, libOptions, {} as Logger),
    ).toEqual([
      { format: 'es', name: 'A' },
      { format: 'cjs', name: 'A' },
    ])
    expect(
      resolveBuildOutputs([{ name: 'A' }], libOptions, {} as Logger),
    ).toEqual([{ name: 'A' }])
  })

  test('umd or iife: should not support multiple entries', () => {
    ;['umd', 'iife'].forEach((format) => {
      expect(() =>
        resolveBuildOutputs(
          undefined,
          {
            entry: ['entryA.js', 'entryB.js'],
            formats: [format as LibraryFormats],
          },
          {} as Logger,
        ),
      ).toThrow(
        `Multiple entry points are not supported when output formats include "umd" or "iife".`,
      )
    })
  })

  test('umd or iife: should define build.lib.name', () => {
    ;['umd', 'iife'].forEach((format) => {
      expect(() =>
        resolveBuildOutputs(
          undefined,
          {
            entry: 'entryA.js',
            formats: [format as LibraryFormats],
          },
          {} as Logger,
        ),
      ).toThrow(
        `Option "build.lib.name" is required when output formats include "umd" or "iife".`,
      )
    })
  })

  test('array outputs: should ignore build.lib.formats', () => {
    const log = { warn: vi.fn() } as unknown as Logger
    expect(
      resolveBuildOutputs(
        [{ name: 'A' }],
        {
          entry: 'entryA.js',
          formats: ['es'],
        },
        log,
      ),
    ).toEqual([{ name: 'A' }])
    expect(log.warn).toHaveBeenLastCalledWith(
      colors.yellow(
        `"build.lib.formats" will be ignored because "build.rollupOptions.output" is already an array format.`,
      ),
    )
  })

  test('ssrEmitAssets', async () => {
    const result = await build({
      root: resolve(__dirname, 'fixtures/emit-assets'),
      logLevel: 'silent',
      build: {
        ssr: true,
        ssrEmitAssets: true,
        rollupOptions: {
          input: {
            index: '/entry',
          },
        },
      },
    })
    expect(result).toMatchObject({
      output: [
        {
          fileName: 'index.mjs',
        },
        {
          fileName: expect.stringMatching(/assets\/index-[-\w]{8}\.css/),
        },
      ],
    })
  })

  test('emitAssets', async () => {
    const builder = await createBuilder({
      root: resolve(__dirname, 'fixtures/emit-assets'),
      logLevel: 'warn',
      environments: {
        ssr: {
          build: {
            ssr: true,
            emitAssets: true,
            rollupOptions: {
              input: {
                index: '/entry',
              },
            },
          },
        },
      },
    })
    const result = await builder.build(builder.environments.ssr)
    expect(result).toMatchObject({
      output: [
        {
          fileName: 'index.mjs',
        },
        {
          fileName: expect.stringMatching(/assets\/index-[-\w]{8}\.css/),
        },
      ],
    })
  })

  test('ssr builtin', async () => {
    const builder = await createBuilder({
      root: resolve(__dirname, 'fixtures/dynamic-import'),
      logLevel: 'warn',
      environments: {
        ssr: {
          build: {
            ssr: true,
            rollupOptions: {
              input: {
                index: '/entry',
              },
            },
          },
        },
      },
    })
    const result = await builder.build(builder.environments.ssr)
    expect((result as RollupOutput).output[0].code).not.toContain('preload')
  })

  test('ssr custom', async () => {
    const builder = await createBuilder({
      root: resolve(__dirname, 'fixtures/dynamic-import'),
      logLevel: 'warn',
      environments: {
        custom: {
          build: {
            ssr: true,
            rollupOptions: {
              input: {
                index: '/entry',
              },
            },
          },
        },
      },
    })
    const result = await builder.build(builder.environments.custom)
    expect((result as RollupOutput).output[0].code).not.toContain('preload')
  })
})

test('default sharedConfigBuild true on build api', async () => {
  let counter = 0
  await build({
    root: resolve(__dirname, 'fixtures/emit-assets'),
    logLevel: 'warn',
    build: {
      ssr: true,
      rollupOptions: {
        input: {
          index: '/entry',
        },
      },
    },
    plugins: [
      {
        name: 'test-plugin',
        config() {
          counter++
        },
      },
    ],
  })
  expect(counter).toBe(1)
})

test.for([true, false])(
  'minify per environment (builder.sharedPlugins: %s)',
  async (sharedPlugins) => {
    const root = resolve(__dirname, 'fixtures/shared-plugins/minify')
    const builder = await createBuilder({
      root,
      logLevel: 'warn',
      environments: {
        client: {
          build: {
            outDir: './dist/client',
            rollupOptions: {
              input: '/entry.js',
            },
          },
        },
        ssr: {
          build: {
            outDir: './dist/server',
            rollupOptions: {
              input: '/entry.js',
            },
          },
        },
        custom1: {
          build: {
            minify: true,
            outDir: './dist/custom1',
            rollupOptions: {
              input: '/entry.js',
            },
          },
        },
        custom2: {
          build: {
            minify: false,
            outDir: './dist/custom2',
            rollupOptions: {
              input: '/entry.js',
            },
          },
        },
      },
      builder: {
        sharedPlugins,
      },
    })
    const client = await builder.build(builder.environments.client)
    const ssr = await builder.build(builder.environments.ssr)
    const custom1 = await builder.build(builder.environments.custom1)
    const custom2 = await builder.build(builder.environments.custom2)
    expect(
      ([client, ssr, custom1, custom2] as RollupOutput[]).map(
        (o) => o.output[0].code.split('\n').length,
      ),
    ).toEqual([2, 5, 2, 5])
  },
)

test('adjust worker build error for worker.format', async () => {
  try {
    await build({
      root: resolve(__dirname, 'fixtures/worker-dynamic'),
      build: {
        rollupOptions: {
          input: {
            index: '/main.js',
          },
        },
      },
      logLevel: 'silent',
    })
  } catch (e) {
    expect(e.message).toContain('worker.format')
    expect(e.message).not.toContain('output.format')
    return
  }
  expect.unreachable()
})

describe('onRollupLog', () => {
  const pluginName = 'rollup-plugin-test'
  const msgInfo = 'This is the INFO message.'
  const msgWarn = 'This is the WARN message.'
  const buildProject = async (
    level: LogLevel | 'error',
    message: string | RollupLog,
    logger: Logger,
    options?: Pick<RollupOptions, 'onLog' | 'onwarn'>,
  ) => {
    await build({
      root: resolve(__dirname, 'packages/build-project'),
      logLevel: 'info',
      build: {
        write: false,
        rollupOptions: {
          ...options,
          logLevel: 'debug',
        },
      },
      customLogger: logger,
      plugins: [
        {
          name: pluginName,
          resolveId(id) {
            this[level](message)
            if (id === 'entry.js') {
              return '\0' + id
            }
          },
          load(id) {
            if (id === '\0entry.js') {
              return `export default "This is test module";`
            }
          },
        },
      ],
    })
  }

  const callOnRollupLog = async (
    logger: Logger,
    level: LogLevel,
    log: RollupLog,
  ) => {
    const config = await resolveConfig(
      { customLogger: logger },
      'build',
      'production',
      'production',
    )
    const buildEnvironment = new BuildEnvironment('client', config)
    onRollupLog(level, log, buildEnvironment)
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('Rollup logs of info should be handled by vite', async () => {
    const logger = createLogger()
    const loggerSpy = vi.spyOn(logger, 'info').mockImplementation(() => {})

    await buildProject('info', msgInfo, logger)
    const logs = loggerSpy.mock.calls.map((args) =>
      stripVTControlCharacters(args[0]),
    )
    expect(logs).contain(`[plugin ${pluginName}] ${msgInfo}`)
  })

  test('Rollup logs of warn should be handled by vite', async () => {
    const logger = createLogger('silent')
    const loggerSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

    await buildProject('warn', msgWarn, logger)
    const logs = loggerSpy.mock.calls.map((args) =>
      stripVTControlCharacters(args[0]),
    )
    expect(logs).contain(`[plugin ${pluginName}] ${msgWarn}`)
  })

  test('onLog passed by user is called', async () => {
    const logger = createLogger('silent')

    const onLogInfo = vi.fn((_log: RollupLog) => {})
    await buildProject('info', msgInfo, logger, {
      onLog(level, log) {
        if (level === 'info') {
          onLogInfo(log)
        }
      },
    })
    expect(onLogInfo).toBeCalledWith(
      expect.objectContaining({ message: `[plugin ${pluginName}] ${msgInfo}` }),
    )
  })

  test('onwarn passed by user is called', async () => {
    const logger = createLogger('silent')

    const onWarn = vi.fn((_log: RollupLog) => {})
    await buildProject('warn', msgWarn, logger, {
      onwarn(warning) {
        onWarn(warning)
      },
    })
    expect(onWarn).toBeCalledWith(
      expect.objectContaining({ message: `[plugin ${pluginName}] ${msgWarn}` }),
    )
  })

  test('should throw error when warning contains UNRESOLVED_IMPORT', async () => {
    const logger = createLogger()
    await expect(() =>
      callOnRollupLog(logger, 'warn', {
        code: 'UNRESOLVED_IMPORT',
        message: 'test',
      }),
    ).rejects.toThrowError(/Rollup failed to resolve import/)
  })

  test.each([[`Unsupported expression`], [`statically analyzed`]])(
    'should ignore dynamic import warnings (%s)',
    async (message: string) => {
      const logger = createLogger()
      const loggerSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      await callOnRollupLog(logger, 'warn', {
        code: 'PLUGIN_WARNING',
        message: message,
        plugin: 'rollup-plugin-dynamic-import-variables',
      })
      expect(loggerSpy).toBeCalledTimes(0)
    },
  )

  test.each([[`CIRCULAR_DEPENDENCY`], [`THIS_IS_UNDEFINED`]])(
    'should ignore some warnings (%s)',
    async (code: string) => {
      const logger = createLogger()
      const loggerSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      await callOnRollupLog(logger, 'warn', {
        code: code,
        message: 'test message',
        plugin: pluginName,
      })
      expect(loggerSpy).toBeCalledTimes(0)
    },
  )
})

/**
 * for each chunks in output1, if there's a chunk in output2 with the same fileName,
 * ensure that the chunk code is the same. if not, the chunk hash should have changed.
 */
function assertOutputHashContentChange(
  output1: RollupOutput,
  output2: RollupOutput,
) {
  for (const chunk of output1.output) {
    if (chunk.type === 'chunk') {
      const chunk2 = output2.output.find(
        (c) => c.type === 'chunk' && c.fileName === chunk.fileName,
      ) as OutputChunk | undefined
      if (chunk2) {
        expect(
          chunk.code,
          `the ${chunk.fileName} chunk has the same hash but different contents between builds`,
        ).toEqual(chunk2.code)
      }
    }
  }
}

function getOutputHashChanges(output1: RollupOutput, output2: RollupOutput) {
  const map1 = Object.fromEntries(
    output1.output.map((o) => [o.name, o.fileName]),
  )
  const map2 = Object.fromEntries(
    output2.output.map((o) => [o.name, o.fileName]),
  )
  const names = Object.keys(map1).filter(Boolean)
  return {
    changed: names.filter((name) => map1[name] !== map2[name]),
    unchanged: names.filter((name) => map1[name] === map2[name]),
  }
}

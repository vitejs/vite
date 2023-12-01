import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import colors from 'picocolors'
import { describe, expect, test, vi } from 'vitest'
import type { OutputChunk, OutputOptions, RollupOutput } from 'rollup'
import type { LibraryFormats, LibraryOptions } from '../build'
import { build, createResolveLibFilename, resolveBuildOutputs } from '../build'
import type { Logger } from '../logger'
import { createLogger } from '../logger'

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
    assertOutputHashContentChange(result[0], result[1])
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
  test('custom filename function', async () => {
    const resolveLibFilename = await createResolveLibFilename(
      {
        fileName: (format) => `custom-filename-function.${format}.js`,
        entry: 'mylib.js',
      },
      'es',
      resolve(__dirname, 'packages/name'),
    )
    const filename = resolveLibFilename({ name: 'myLib' })
    expect(filename).toBe('custom-filename-function.es.js')
  })

  test('custom filename string', async () => {
    const resolveLibFilename = await createResolveLibFilename(
      {
        fileName: 'custom-filename',
        entry: 'mylib.js',
      },
      'es',
      resolve(__dirname, 'packages/name'),
    )
    const filename = resolveLibFilename({ name: 'myLib' })
    expect(filename).toBe('custom-filename.mjs')
  })

  test('package name as filename', async () => {
    const resolveLibFilename = await createResolveLibFilename(
      {
        entry: 'mylib.js',
      },
      'es',
      resolve(__dirname, 'packages/name'),
    )
    const filename = resolveLibFilename({ name: 'myLib' })
    expect(filename).toBe('mylib.mjs')
  })

  test('custom filename and no package name', async () => {
    const resolveLibFilename = await createResolveLibFilename(
      {
        fileName: 'custom-filename',
        entry: 'mylib.js',
      },
      'es',
      resolve(__dirname, 'packages/noname'),
    )
    const filename = resolveLibFilename({ name: 'myLib' })
    expect(filename).toBe('custom-filename.mjs')
  })

  test('missing filename', async () => {
    const resolveLibFilename = await createResolveLibFilename(
      {
        entry: 'mylib.js',
      },
      'es',
      resolve(__dirname, 'packages/noname'),
    )
    expect(() => {
      resolveLibFilename({ name: 'myLib' })
    }).toThrow()
  })

  test('commonjs package extensions', async () => {
    const formatsToFilenames: FormatsToFileNames = [
      ['es', 'my-lib.mjs'],
      ['umd', 'my-lib.umd.js'],
      ['cjs', 'my-lib.js'],
      ['iife', 'my-lib.iife.js'],
    ]

    for (const [format, expectedFilename] of formatsToFilenames) {
      const resolveLibFilename = await createResolveLibFilename(
        baseLibOptions,
        format,
        resolve(__dirname, 'packages/noname'),
      )
      const filename = resolveLibFilename({ name: 'myLib' })
      expect(filename).toBe(expectedFilename)
    }
  })

  test('module package extensions', async () => {
    const formatsToFilenames: FormatsToFileNames = [
      ['es', 'my-lib.js'],
      ['umd', 'my-lib.umd.cjs'],
      ['cjs', 'my-lib.cjs'],
      ['iife', 'my-lib.iife.js'],
    ]

    for (const [format, expectedFilename] of formatsToFilenames) {
      const resolveLibFilename = await createResolveLibFilename(
        baseLibOptions,
        format,
        resolve(__dirname, 'packages/module'),
      )
      const filename = resolveLibFilename({ name: 'myLib' })
      expect(expectedFilename).toBe(filename)
    }
  })

  test('multiple entries with aliases', async () => {
    const libOptions: LibraryOptions = {
      entry: {
        entryA: 'entryA.js',
        entryB: 'entryB.js',
      },
    }
    const resolveLibFilename = await createResolveLibFilename(
      libOptions,
      'es',
      resolve(__dirname, 'packages/name'),
    )
    const [fileName1, fileName2] = ['entryA', 'entryB'].map((entryAlias) =>
      resolveLibFilename({ name: entryAlias }),
    )

    expect(fileName1).toBe('entryA.mjs')
    expect(fileName2).toBe('entryB.mjs')
  })

  test('multiple entries with aliases: custom filename function', async () => {
    const libOptions: LibraryOptions = {
      entry: {
        entryA: 'entryA.js',
        entryB: 'entryB.js',
      },
      fileName: (format, entryAlias) =>
        `custom-filename-function.${entryAlias}.${format}.js`,
    }
    const resolveLibFilename = await createResolveLibFilename(
      libOptions,
      'es',
      resolve(__dirname, 'packages/name'),
    )
    const [fileName1, fileName2] = ['entryA', 'entryB'].map((entryAlias) =>
      resolveLibFilename({ name: entryAlias }),
    )

    expect(fileName1).toBe('custom-filename-function.entryA.es.js')
    expect(fileName2).toBe('custom-filename-function.entryB.es.js')
  })

  test('multiple entries with aliases: custom filename string', async () => {
    const libOptions: LibraryOptions = {
      entry: {
        entryA: 'entryA.js',
        entryB: 'entryB.js',
      },
      fileName: 'custom-filename',
    }
    const resolveLibFilename = await createResolveLibFilename(
      libOptions,
      'es',
      resolve(__dirname, 'packages/name'),
    )
    const [fileName1, fileName2] = ['entryA', 'entryB'].map((entryAlias) =>
      resolveLibFilename({ name: entryAlias }),
    )

    expect(fileName1).toBe('custom-filename.mjs')
    expect(fileName2).toBe('custom-filename.mjs')
  })

  test('multiple entries as array', async () => {
    const libOptions: LibraryOptions = {
      entry: ['entryA.js', 'entryB.js'],
    }
    const resolveLibFilename = await createResolveLibFilename(
      libOptions,
      'es',
      resolve(__dirname, 'packages/name'),
    )
    const [fileName1, fileName2] = ['entryA', 'entryB'].map((entryAlias) =>
      resolveLibFilename({ name: entryAlias }),
    )

    expect(fileName1).toBe('entryA.mjs')
    expect(fileName2).toBe('entryB.mjs')
  })

  test('multiple entries as array: custom filename function', async () => {
    const libOptions: LibraryOptions = {
      entry: ['entryA.js', 'entryB.js'],
      fileName: (format, entryAlias) =>
        `custom-filename-function.${entryAlias}.${format}.js`,
    }
    const resolveLibFilename = await createResolveLibFilename(
      libOptions,
      'es',
      resolve(__dirname, 'packages/name'),
    )
    const [fileName1, fileName2] = ['entryA', 'entryB'].map((entryAlias) =>
      resolveLibFilename({ name: entryAlias }),
    )

    expect(fileName1).toBe('custom-filename-function.entryA.es.js')
    expect(fileName2).toBe('custom-filename-function.entryB.es.js')
  })

  test('multiple entries as array: custom filename string', async () => {
    const libOptions: LibraryOptions = {
      entry: ['entryA.js', 'entryB.js'],
      fileName: 'custom-filename',
    }
    const resolveLibFilename = await createResolveLibFilename(
      libOptions,
      'es',
      resolve(__dirname, 'packages/name'),
    )

    const [fileName1, fileName2] = ['entryA', 'entryB'].map((entryAlias) =>
      resolveLibFilename({ name: entryAlias }),
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

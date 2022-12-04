import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import colors from 'picocolors'
import type { Logger } from 'vite'
import { describe, expect, test, vi } from 'vitest'
import type { OutputOptions } from 'rollup'
import type { LibraryFormats, LibraryOptions } from '../build'
import { resolveBuildOutputs, resolveLibFilename } from '../build'
import { createLogger } from '../logger'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')

type FormatsToFileNames = [LibraryFormats, string][]
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
    // @ts-expect-error mock Logger
    const log = { warn: vi.fn() } as Logger
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

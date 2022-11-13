import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import colors from 'picocolors'
import type { Logger } from 'vite'
import { describe, expect, test, vi } from 'vitest'
import type { OutputOptions } from 'rollup'
import type { LibraryFormats, LibraryOptions } from '../build'
import {
  resolveBuildOutputs,
  resolveBuilds,
  resolveLibFilename,
  resolveLibName
} from '../build'
import { createLogger } from '../logger'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')

type FormatsToFileNames = [LibraryFormats, string][]
const baseLibOptions: LibraryOptions = {
  fileName: 'my-lib',
  entry: 'mylib.js'
}

describe('resolveBuildOutputs', () => {
  test('resolves outputs correctly', () => {
    const logger = createLogger()
    const libOptions: LibraryOptions = { ...baseLibOptions }
    const outputs: OutputOptions[] = [{ format: 'es' }]
    const resolvedOutputs = resolveBuildOutputs(
      libOptions.entry,
      outputs,
      libOptions,
      logger
    )

    expect(resolvedOutputs).toEqual([
      {
        format: 'es'
      }
    ])
  })

  test('resolves outputs from lib options', () => {
    const logger = createLogger()
    const libOptions: LibraryOptions = { ...baseLibOptions, name: 'lib' }
    const resolvedOutputs = resolveBuildOutputs(
      libOptions.entry,
      void 0,
      libOptions,
      logger
    )

    expect(resolvedOutputs).toEqual([
      {
        format: 'es'
      },
      {
        format: 'umd'
      }
    ])
  })

  test('does not change outputs when lib options are missing', () => {
    const logger = createLogger()
    const outputs: OutputOptions[] = [{ format: 'es' }]
    const resolvedOutputs = resolveBuildOutputs('', outputs, false, logger)

    expect(resolvedOutputs).toEqual(outputs)
  })

  test('logs a warning when outputs is an array and formats are specified', () => {
    const logger = createLogger()
    const loggerSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const libOptions: LibraryOptions = {
      ...baseLibOptions,
      formats: ['iife']
    }
    const outputs: OutputOptions[] = [{ format: 'es' }]

    resolveBuildOutputs(libOptions.entry, outputs, libOptions, logger)

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('"build.lib.formats" will be ignored because')
    )
  })

  test('throws an error when lib.name is missing on iife format', () => {
    const logger = createLogger()
    const libOptions: LibraryOptions = {
      ...baseLibOptions,
      formats: ['iife']
    }
    const resolveBuild = () =>
      resolveBuildOutputs(libOptions.entry, void 0, libOptions, logger)

    expect(resolveBuild).toThrowError(
      `"build.lib.entry"/"build.rollupOptions.input" must be defined as object or option ` +
        `"build.lib.name"/"build.rollupOptions.output.name" must be provided when output formats include "umd" or "iife".`
    )
  })

  test('throws an error when lib.name is missing on umd format', () => {
    const logger = createLogger()
    const libOptions: LibraryOptions = { ...baseLibOptions, formats: ['umd'] }
    const resolveBuild = () =>
      resolveBuildOutputs(libOptions.entry, void 0, libOptions, logger)

    expect(resolveBuild).toThrowError(
      `"build.lib.entry"/"build.rollupOptions.input" must be defined as object or option ` +
        `"build.lib.name"/"build.rollupOptions.output.name" must be provided when output formats include "umd" or "iife".`
    )
  })

  test('throws an error when output.name is missing on iife format', () => {
    const logger = createLogger()
    const libOptions: LibraryOptions = { ...baseLibOptions }
    const outputs: OutputOptions[] = [{ format: 'iife' }]
    const resolveBuild = () =>
      resolveBuildOutputs(libOptions.entry, outputs, libOptions, logger)

    expect(resolveBuild).toThrowError(
      `"build.lib.entry"/"build.rollupOptions.input" must be defined as object or option ` +
        `"build.lib.name"/"build.rollupOptions.output.name" must be provided when output formats include "umd" or "iife".`
    )
  })

  test('throws an error when output.name is missing on umd format', () => {
    const logger = createLogger()
    const libOptions: LibraryOptions = { ...baseLibOptions }
    const outputs: OutputOptions[] = [{ format: 'umd' }]
    const resolveBuild = () =>
      resolveBuildOutputs(libOptions.entry, outputs, libOptions, logger)

    expect(resolveBuild).toThrowError(
      `"build.lib.entry"/"build.rollupOptions.input" must be defined as object or option ` +
        `"build.lib.name"/"build.rollupOptions.output.name" must be provided when output formats include "umd" or "iife".`
    )
  })
})

describe('resolveLibFilename', () => {
  test('custom filename function', () => {
    const filename = resolveLibFilename(
      {
        fileName: (format) => `custom-filename-function.${format}.js`,
        entry: 'mylib.js'
      },
      'es',
      'myLib',
      resolve(__dirname, 'packages/name')
    )

    expect(filename).toBe('custom-filename-function.es.js')
  })

  test('custom filename string', () => {
    const filename = resolveLibFilename(
      {
        fileName: 'custom-filename',
        entry: 'mylib.js'
      },
      'es',
      'myLib',
      resolve(__dirname, 'packages/name')
    )

    expect(filename).toBe('custom-filename.mjs')
  })

  test('package name as filename', () => {
    const filename = resolveLibFilename(
      {
        entry: 'mylib.js'
      },
      'es',
      'myLib',
      resolve(__dirname, 'packages/name')
    )

    expect(filename).toBe('mylib.mjs')
  })

  test('custom filename and no package name', () => {
    const filename = resolveLibFilename(
      {
        fileName: 'custom-filename',
        entry: 'mylib.js'
      },
      'es',
      'myLib',
      resolve(__dirname, 'packages/noname')
    )

    expect(filename).toBe('custom-filename.mjs')
  })

  test('missing filename', () => {
    expect(() => {
      resolveLibFilename(
        {
          entry: 'mylib.js'
        },
        'es',
        'myLib',
        resolve(__dirname, 'packages/noname')
      )
    }).toThrow()
  })

  test('commonjs package extensions', () => {
    const formatsToFilenames: FormatsToFileNames = [
      ['es', 'my-lib.mjs'],
      ['umd', 'my-lib.umd.js'],
      ['cjs', 'my-lib.js'],
      ['iife', 'my-lib.iife.js']
    ]

    for (const [format, expectedFilename] of formatsToFilenames) {
      const filename = resolveLibFilename(
        baseLibOptions,
        format,
        'myLib',
        resolve(__dirname, 'packages/noname')
      )

      expect(filename).toBe(expectedFilename)
    }
  })

  test('module package extensions', () => {
    const formatsToFilenames: FormatsToFileNames = [
      ['es', 'my-lib.js'],
      ['umd', 'my-lib.umd.cjs'],
      ['cjs', 'my-lib.cjs'],
      ['iife', 'my-lib.iife.js']
    ]

    for (const [format, expectedFilename] of formatsToFilenames) {
      const filename = resolveLibFilename(
        baseLibOptions,
        format,
        'myLib',
        resolve(__dirname, 'packages/module')
      )

      expect(expectedFilename).toBe(filename)
    }
  })

  test('multiple entries with aliases', () => {
    const libOptions: LibraryOptions = {
      entry: {
        entryA: 'entryA.js',
        entryB: 'entryB.js'
      }
    }

    const [fileName1, fileName2] = ['entryA', 'entryB'].map((entryAlias) =>
      resolveLibFilename(
        libOptions,
        'es',
        entryAlias,
        resolve(__dirname, 'packages/name')
      )
    )

    expect(fileName1).toBe('entryA.mjs')
    expect(fileName2).toBe('entryB.mjs')
  })

  test('multiple entries with aliases: custom filename function', () => {
    const libOptions: LibraryOptions = {
      entry: {
        entryA: 'entryA.js',
        entryB: 'entryB.js'
      },
      fileName: (format, entryAlias) =>
        `custom-filename-function.${entryAlias}.${format}.js`
    }

    const [fileName1, fileName2] = ['entryA', 'entryB'].map((entryAlias) =>
      resolveLibFilename(
        libOptions,
        'es',
        entryAlias,
        resolve(__dirname, 'packages/name')
      )
    )

    expect(fileName1).toBe('custom-filename-function.entryA.es.js')
    expect(fileName2).toBe('custom-filename-function.entryB.es.js')
  })

  test('multiple entries with aliases: custom filename string', () => {
    const libOptions: LibraryOptions = {
      entry: {
        entryA: 'entryA.js',
        entryB: 'entryB.js'
      },
      fileName: 'custom-filename'
    }

    const [fileName1, fileName2] = ['entryA', 'entryB'].map((entryAlias) =>
      resolveLibFilename(
        libOptions,
        'es',
        entryAlias,
        resolve(__dirname, 'packages/name')
      )
    )

    expect(fileName1).toBe('custom-filename.mjs')
    expect(fileName2).toBe('custom-filename.mjs')
  })

  test('multiple entries as array', () => {
    const libOptions: LibraryOptions = {
      entry: ['entryA.js', 'entryB.js']
    }

    const [fileName1, fileName2] = ['entryA', 'entryB'].map((entryAlias) =>
      resolveLibFilename(
        libOptions,
        'es',
        entryAlias,
        resolve(__dirname, 'packages/name')
      )
    )

    expect(fileName1).toBe('entryA.mjs')
    expect(fileName2).toBe('entryB.mjs')
  })

  test('multiple entries as array: custom filename function', () => {
    const libOptions: LibraryOptions = {
      entry: ['entryA.js', 'entryB.js'],
      fileName: (format, entryAlias) =>
        `custom-filename-function.${entryAlias}.${format}.js`
    }

    const [fileName1, fileName2] = ['entryA', 'entryB'].map((entryAlias) =>
      resolveLibFilename(
        libOptions,
        'es',
        entryAlias,
        resolve(__dirname, 'packages/name')
      )
    )

    expect(fileName1).toBe('custom-filename-function.entryA.es.js')
    expect(fileName2).toBe('custom-filename-function.entryB.es.js')
  })

  test('multiple entries as array: custom filename string', () => {
    const libOptions: LibraryOptions = {
      entry: ['entryA.js', 'entryB.js'],
      fileName: 'custom-filename'
    }

    const [fileName1, fileName2] = ['entryA', 'entryB'].map((entryAlias) =>
      resolveLibFilename(
        libOptions,
        'es',
        entryAlias,
        resolve(__dirname, 'packages/name')
      )
    )

    expect(fileName1).toBe('custom-filename.mjs')
    expect(fileName2).toBe('custom-filename.mjs')
  })
})

describe('resolveBuildOutputs', () => {
  test('default format: one entry', () => {
    const libOptions: LibraryOptions = {
      entry: 'entryA.js',
      name: 'entryA'
    }

    expect(
      resolveBuildOutputs(libOptions.entry, undefined, libOptions, {} as Logger)
    ).toEqual([{ format: 'es' }, { format: 'umd' }])
    expect(
      resolveBuildOutputs(
        libOptions.entry,
        { name: 'A' },
        libOptions,
        {} as Logger
      )
    ).toEqual([
      { format: 'es', name: 'A' },
      { format: 'umd', name: 'A' }
    ])
    expect(
      resolveBuildOutputs(
        libOptions.entry,
        [{ name: 'A' }],
        libOptions,
        {} as Logger
      )
    ).toEqual([{ name: 'A' }])
  })

  test('default format: multiple entries', () => {
    const libOptions: LibraryOptions = {
      entry: ['entryA.js', 'entryB.js']
    }

    expect(
      resolveBuildOutputs(libOptions.entry, undefined, libOptions, {} as Logger)
    ).toEqual([{ format: 'es' }, { format: 'cjs' }])
    expect(
      resolveBuildOutputs(
        libOptions.entry,
        { name: 'A' },
        libOptions,
        {} as Logger
      )
    ).toEqual([
      { format: 'es', name: 'A' },
      { format: 'cjs', name: 'A' }
    ])
    expect(
      resolveBuildOutputs(
        libOptions.entry,
        [{ name: 'A' }],
        libOptions,
        {} as Logger
      )
    ).toEqual([{ name: 'A' }])
  })

  test('array outputs: should ignore build.lib.formats', () => {
    // @ts-expect-error mock Logger
    const log = { warn: vi.fn() } as Logger
    expect(
      resolveBuildOutputs(
        'entryA.js',
        [{ name: 'A' }],
        {
          entry: 'entryA.js',
          formats: ['es']
        },
        log
      )
    ).toEqual([{ name: 'A' }])
    expect(log.warn).toHaveBeenLastCalledWith(
      colors.yellow(
        `"build.lib.formats" will be ignored because "build.rollupOptions.output" is already an array format.`
      )
    )
  })

  test('error on missing names for multiple entries', () => {
    const libOptions: LibraryOptions = {
      entry: ['entryA.js', 'entryB.js'],
      formats: ['umd']
    }

    expect(() =>
      resolveBuildOutputs(libOptions.entry, undefined, libOptions, {} as Logger)
    ).toThrow(
      `"build.lib.entry"/"build.rollupOptions.input" must be defined as object when there are multiple ` +
        `inputs and output formats include "umd" or "iife".`
    )
  })
})

describe('resolveBuilds', () => {
  test('one entry, one build', () => {
    const libOptions: LibraryOptions = {
      entry: 'entryA.js',
      name: 'entryA',
      formats: ['es', 'cjs', 'umd', 'iife']
    }

    const builds = resolveBuilds(
      libOptions.entry,
      undefined,
      libOptions,
      (_input) => (output) => output,
      {} as Logger
    )

    expect(builds).toEqual([
      {
        input: 'entryA.js',
        output: [
          { format: 'es' },
          { format: 'cjs' },
          { format: 'umd' },
          { format: 'iife' }
        ]
      }
    ])
  })

  test('multiple entries, one build', () => {
    const libOptions: LibraryOptions = {
      entry: {
        entryA: 'entryA.js',
        entryB: 'entryB.js'
      },
      formats: ['es', 'cjs']
    }

    const builds = resolveBuilds(
      libOptions.entry,
      undefined,
      libOptions,
      (_input) => (output) => output,
      {} as Logger
    )

    expect(builds).toEqual([
      {
        input: {
          entryA: 'entryA.js',
          entryB: 'entryB.js'
        },
        output: [{ format: 'es' }, { format: 'cjs' }]
      }
    ])
  })

  test('multiple builds', () => {
    const libOptions: LibraryOptions = {
      entry: {
        entryA: 'entryA.js',
        entryB: 'entryB.js'
      },
      formats: ['es', 'cjs', 'umd', 'iife']
    }

    const builds = resolveBuilds(
      libOptions.entry,
      undefined,
      libOptions,
      (_input) => (output) => output,
      {} as Logger
    )

    expect(builds).toEqual([
      {
        input: {
          entryA: 'entryA.js',
          entryB: 'entryB.js'
        },
        output: [{ format: 'es' }, { format: 'cjs' }]
      },
      {
        input: { entryA: 'entryA.js' },
        output: [{ format: 'umd' }, { format: 'iife' }],
        label: 'Extra non code splitting build for entry: entryA'
      },
      {
        input: { entryB: 'entryB.js' },
        output: [{ format: 'umd' }, { format: 'iife' }],
        label: 'Extra non code splitting build for entry: entryB'
      }
    ])
  })
})

describe('resolveLibName', () => {
  test('returns name if provided', () => {
    const libOptions: LibraryOptions = {
      entry: '',
      name: 'lib'
    }

    const name = resolveLibName(libOptions, '')
    expect(name).toBe('lib')
  })

  test('returns name from entries object', () => {
    const libOptions: LibraryOptions = {
      entry: {
        entryA: 'entryA.js'
      }
    }

    const name = resolveLibName(libOptions, libOptions.entry)
    expect(name).toBe('entryA')
  })
})

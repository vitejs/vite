import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Logger } from 'vite'
import { describe, expect, test } from 'vitest'
import type { LibraryFormats, LibraryOptions } from '../build'
import { resolveBuildOutputs, resolveLibFilename } from '../build'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')

type FormatsToFileNames = [LibraryFormats, string][]
const baseLibOptions: LibraryOptions = {
  fileName: 'my-lib',
  entry: 'mylib.js'
}

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

    const outputs = resolveBuildOutputs(undefined, libOptions, {} as Logger)

    expect(outputs).toEqual([{ format: 'es' }, { format: 'umd' }])
  })

  test('default format: multiple entries', () => {
    const libOptions: LibraryOptions = {
      entry: ['entryA.js', 'entryB.js']
    }

    const outputs = resolveBuildOutputs(undefined, libOptions, {} as Logger)

    expect(outputs).toEqual([{ format: 'es' }, { format: 'cjs' }])
  })
})

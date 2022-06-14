import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, test } from 'vitest'
import type { LibraryFormats, LibraryOptions } from '../build'
import { resolveLibFilename } from '../build'

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
        resolve(__dirname, 'packages/module')
      )

      expect(expectedFilename).toBe(filename)
    }
  })
})

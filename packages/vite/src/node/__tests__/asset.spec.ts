import { describe, expect, test } from 'vitest'
import { assetFileNamesToFileName } from '../plugins/asset'

describe('assetFileNamesToFileName', () => {
  // on Windows, both forward slashes and backslashes may appear in the input
  const sourceFilepaths: readonly string[] =
    process.platform === 'win32'
      ? ['C:/path/to/source/input.png', 'C:\\path\\to\\source\\input.png']
      : ['/path/to/source/input.png']

  for (const sourceFilepath of sourceFilepaths) {
    const content = Buffer.alloc(0)
    const contentHash = 'abcd1234'

    // basic examples

    test('a string with no placeholders', () => {
      const fileName = assetFileNamesToFileName(
        'output.png',
        sourceFilepath,
        contentHash,
        content
      )

      expect(fileName).toBe('output.png')
    })

    test('a string with placeholders', () => {
      const fileName = assetFileNamesToFileName(
        'assets/[name]/[ext]/[extname]/[hash]',
        sourceFilepath,
        contentHash,
        content
      )

      expect(fileName).toBe('assets/input/png/.png/abcd1234')
    })

    // function examples

    test('a function that uses asset information', () => {
      const fileName = assetFileNamesToFileName(
        (options) =>
          `assets/${options.name.replace(/^C:|[/\\]/g, '')}/${options.type}/${
            options.source.length
          }`,
        sourceFilepath,
        contentHash,
        content
      )

      expect(fileName).toBe('assets/pathtosourceinput.png/asset/0')
    })

    test('a function that returns a string with no placeholders', () => {
      const fileName = assetFileNamesToFileName(
        () => 'output.png',
        sourceFilepath,
        contentHash,
        content
      )

      expect(fileName).toBe('output.png')
    })

    test('a function that returns a string with placeholders', () => {
      const fileName = assetFileNamesToFileName(
        () => 'assets/[name]/[ext]/[extname]/[hash]',
        sourceFilepath,
        contentHash,
        content
      )

      expect(fileName).toBe('assets/input/png/.png/abcd1234')
    })

    // invalid cases

    test('a string with an invalid placeholder', () => {
      expect(() => {
        assetFileNamesToFileName(
          'assets/[invalid]',
          sourceFilepath,
          contentHash,
          content
        )
      }).toThrowError(
        'invalid placeholder [invalid] in assetFileNames "assets/[invalid]"'
      )

      expect(() => {
        assetFileNamesToFileName(
          'assets/[name][invalid][extname]',
          sourceFilepath,
          contentHash,
          content
        )
      }).toThrowError(
        'invalid placeholder [invalid] in assetFileNames "assets/[name][invalid][extname]"'
      )
    })

    test('a function that returns a string with an invalid placeholder', () => {
      expect(() => {
        assetFileNamesToFileName(
          () => 'assets/[invalid]',
          sourceFilepath,
          contentHash,
          content
        )
      }).toThrowError(
        'invalid placeholder [invalid] in assetFileNames "assets/[invalid]"'
      )

      expect(() => {
        assetFileNamesToFileName(
          () => 'assets/[name][invalid][extname]',
          sourceFilepath,
          contentHash,
          content
        )
      }).toThrowError(
        'invalid placeholder [invalid] in assetFileNames "assets/[name][invalid][extname]"'
      )
    })

    test('a number', () => {
      expect(() => {
        assetFileNamesToFileName(
          9876 as unknown as string,
          sourceFilepath,
          contentHash,
          content
        )
      }).toThrowError('assetFileNames must be a string or a function')
    })

    test('a function that returns a number', () => {
      expect(() => {
        assetFileNamesToFileName(
          () => 9876 as unknown as string,
          sourceFilepath,
          contentHash,
          content
        )
      }).toThrowError('assetFileNames must return a string')
    })
  }
})

import { resolveLibFilename } from '../build'

describe('resolveLibFilename', () => {
  test('custom filename function', () => {
    const filename = resolveLibFilename(
      {
        fileName: (format) => `custom-filename-function.${format}.js`,
        entry: 'mylib.js'
      },
      'es',
      'mylib'
    )

    expect(filename).toBe('custom-filename-function.es.js')
  })

  test('custom filename string', () => {
    const filename = resolveLibFilename(
      { fileName: 'custom-filename', entry: 'mylib.js' },
      'es',
      'mylib'
    )

    expect(filename).toBe('custom-filename.es.js')
  })

  test('package name as filename', () => {
    const filename = resolveLibFilename({ entry: 'mylib.js' }, 'es', 'mylib')

    expect(filename).toBe('mylib.es.js')
  })
})

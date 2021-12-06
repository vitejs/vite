import { resolveLibFilename } from '../build'
import { resolve } from 'path'
import { resolveConfig } from '..'
import expect from 'expect'

describe('resolveLibFilename', () => {
  it('custom filename function', () => {
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

  it('custom filename string', () => {
    const filename = resolveLibFilename(
      {
        fileName: 'custom-filename',
        entry: 'mylib.js'
      },
      'es',
      resolve(__dirname, 'packages/name')
    )

    expect(filename).toBe('custom-filename.es.js')
  })

  it('package name as filename', () => {
    const filename = resolveLibFilename(
      {
        entry: 'mylib.js'
      },
      'es',
      resolve(__dirname, 'packages/name')
    )

    expect(filename).toBe('mylib.es.js')
  })

  it('custom filename and no package name', () => {
    const filename = resolveLibFilename(
      {
        fileName: 'custom-filename',
        entry: 'mylib.js'
      },
      'es',
      resolve(__dirname, 'packages/noname')
    )

    expect(filename).toBe('custom-filename.es.js')
  })

  it('missing filename', () => {
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
})

describe('resolveBuildOptions', () => {
  it('resolve build.rollupOptions.input', async () => {
    const config = await resolveConfig(
      {
        build: {
          rollupOptions: {
            input: 'index.html'
          }
        }
      },
      'build',
      'production'
    )

    expect(config.build.rollupOptions.input).toBe(resolve('index.html'))
  })
  it('resolve build.rollupOptions.input{}', async () => {
    const config = await resolveConfig(
      {
        build: {
          rollupOptions: {
            input: {
              index: 'index.html'
            }
          }
        }
      },
      'build',
      'production'
    )

    expect(config.build.rollupOptions.input['index']).toBe(
      resolve('index.html')
    )
  })

  it('resolve build.rollupOptions.input[]', async () => {
    const config = await resolveConfig(
      {
        build: {
          rollupOptions: {
            input: ['index.html']
          }
        }
      },
      'build',
      'production'
    )

    expect(config.build.rollupOptions.input).toStrictEqual([
      resolve('index.html')
    ])
  })

  it('resolve index.html', async () => {
    const config = await resolveConfig({}, 'build', 'production')

    expect(config.build.rollupOptions.input).toBe(resolve('index.html'))
  })

  it('resolve build.outdir', async () => {
    const config = await resolveConfig(
      { build: { outDir: 'outDir' } },
      'build',
      'production'
    )

    expect(config.build.outDir).toBe(resolve('outDir'))
  })

  it('resolve default build.outdir', async () => {
    const config = await resolveConfig({}, 'build', 'production')

    expect(config.build.outDir).toBe(resolve('dist'))
  })

  it('resolve build.lib.entry', async () => {
    const config = await resolveConfig(
      { build: { lib: { entry: 'index.html' } } },
      'build',
      'production'
    )

    expect(config.build.rollupOptions.input).toBe(resolve('index.html'))
  })

  it('resolve build.ssr', async () => {
    const config = await resolveConfig(
      { build: { ssr: 'ssr.ts' } },
      'build',
      'production'
    )

    expect(config.build.rollupOptions.input).toBe(resolve('ssr.ts'))
  })
})
